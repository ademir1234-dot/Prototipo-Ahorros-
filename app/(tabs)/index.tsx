import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { storage } from '../../storage.web';

export default function Index() {
  const [transcripcion, setTranscripcion] = useState('');
  const [escuchando, setEscuchando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    storage.init();
    actualizarHistorial();
  }, []);

  const actualizarHistorial = () => {
    setHistorial(storage.getAll());
  };

  const iniciarEscucha = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Solo web por ahora', 'En móvil necesitas un EAS Build.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Error', 'Usa Google Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-SV';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setEscuchando(true);
    recognition.onend = () => setEscuchando(false);
    recognition.onresult = (event) => {
      const texto = Array.from(event.results).map(r => r[0].transcript).join('');
      setTranscripcion(texto);
    };
    recognition.onerror = () => {
      setEscuchando(false);
      Alert.alert('Error', 'Permite el micrófono en Chrome.');
    };
    recognitionRef.current = recognition;
    setTranscripcion('');
    recognition.start();
  };

  const detenerEscucha = () => {
    recognitionRef.current?.stop();
    setEscuchando(false);
  };

  const normalizar = (texto) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const procesarTexto = (texto) => {
    if (!texto.trim()) { Alert.alert('Error', 'No se captó texto.'); return; }

    const keywords = ['ahorro', 'ahorro', 'ahorrar', 'presto', 'presto', 'prestamo',
                      'prestamo', 'interes', 'interes'];

    const palabras = texto.trim().split(' ');
    let indicePalabra = -1;

    for (let i = 0; i < palabras.length; i++) {
      const palabraNorm = normalizar(palabras[i]);
      if (keywords.some(k => palabraNorm.includes(k))) {
        indicePalabra = i;
        break;
      }
    }

    let miembro = 'Desconocido';
    if (indicePalabra > 0) {
      miembro = palabras.slice(0, indicePalabra)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    }

    // Normalizar nombre para agrupar correctamente
    const miembroNorm = normalizar(miembro)
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');

    const lowerText = normalizar(texto);
    let tipo = '';
    if (lowerText.includes('ahorr')) tipo = 'Ahorro';
    else if (lowerText.includes('prest')) tipo = 'Préstamo';
    else if (lowerText.includes('interes')) tipo = 'Interés';

    const matchMonto = lowerText.match(/\d+(\.\d+)?/);
    const monto = matchMonto ? parseFloat(matchMonto[0]) : 0;

    if (tipo !== '' && monto > 0) {
      storage.insert(miembroNorm, monto, tipo, new Date().toLocaleDateString('es-SV'));
      Alert.alert('✅ Guardado', `${tipo} de $${monto} para ${miembroNorm}`);
      setTranscripcion('');
      actualizarHistorial();
    } else {
      Alert.alert('No entendido', `Se escuchó:\n"${texto}"\n\nIntenta:\n"Oscar Pérez ahorro 50"`);
    }
  };

  const obtenerIcono = (tipo) => {
    if (tipo === 'Ahorro') return '💚';
    if (tipo === 'Préstamo') return '💙';
    if (tipo === 'Interés') return '🟠';
    return '⚪';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>VozCoop 🎙️</Text>

      <View style={styles.transcripcionBox}>
        <Text style={styles.transcripcionLabel}>Lo que escucho:</Text>
        <Text style={styles.transcripcionTexto}>
          {transcripcion || (escuchando ? '🎙️ Escuchando...' : 'Presiona el botón y habla')}
        </Text>
      </View>

      <View style={styles.botonesVoz}>
        <TouchableOpacity
          style={[styles.botonMic, escuchando && styles.botonMicActivo]}
          onPress={escuchando ? detenerEscucha : iniciarEscucha}
        >
          <Text style={styles.botonMicTexto}>
            {escuchando ? '⏹️ Detener' : '🎙️ Hablar'}
          </Text>
        </TouchableOpacity>

        {transcripcion !== '' && (
          <TouchableOpacity
            style={styles.botonProcesar}
            onPress={() => procesarTexto(transcripcion)}
          >
            <Text style={styles.botonProcesarTexto}>✅ Guardar Registro</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subtitle}>Historial</Text>

      <FlatList
        data={historial}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.vacio}>Sin registros aún. ¡Empieza hablando!</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icon}>{obtenerIcono(item.tipo)}</Text>
            <View>
              <Text style={styles.cardTitle}>{item.miembro} • ${item.monto}</Text>
              <Text style={styles.cardSubtitle}>{item.tipo} - {item.fecha}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5', marginTop: 40 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2E7D32' },
  transcripcionBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginBottom: 15, minHeight: 80 },
  transcripcionLabel: { fontSize: 12, color: '#888', marginBottom: 5 },
  transcripcionTexto: { fontSize: 16, color: '#333' },
  botonesVoz: { marginBottom: 25, gap: 10 },
  botonMic: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  botonMicActivo: { backgroundColor: '#F44336' },
  botonMicTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  botonProcesar: { backgroundColor: '#1976D2', padding: 15, borderRadius: 12, alignItems: 'center' },
  botonProcesarTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  vacio: { textAlign: 'center', color: '#AAA', marginTop: 30, fontSize: 15 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  icon: { fontSize: 30, marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666' }
});
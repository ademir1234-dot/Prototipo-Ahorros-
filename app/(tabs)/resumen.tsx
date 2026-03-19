import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import {
    Alert, FlatList, Modal,
    StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { storage } from '../../storage.web';

export default function Resumen() {
  const [resumen, setResumen] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState('');
  const [nuevaTasa, setNuevaTasa] = useState('');

  useFocusEffect(
    useCallback(() => {
      calcularResumen();
    }, [])
  );

  const calcularResumen = () => {
    const transacciones = storage.getAll();
    const tasas = storage.getTasas();

    const mapa = {};
    transacciones.forEach(t => {
      const nombre = t.miembro;
      if (!mapa[nombre]) {
        mapa[nombre] = { miembro: nombre, ahorro: 0, prestamo: 0 };
      }
      if (t.tipo === 'Ahorro') mapa[nombre].ahorro += t.monto;
      else if (t.tipo === 'Préstamo') mapa[nombre].prestamo += t.monto;
    });

    const resultado = Object.values(mapa).map(m => {
      const tasa = tasas[m.miembro] ?? 0;
      const interes = (m.prestamo * tasa) / 100;
      const saldo = m.ahorro - m.prestamo - interes;
      return { ...m, tasa, interes, saldo };
    });

    setResumen(resultado);
  };

  const leerResumen = () => {
    if (resumen.length === 0) {
      Speech.speak('No hay miembros registrados aún.', { language: 'es-MX' });
      return;
    }
    const texto = resumen.map(m =>
      `${m.miembro}: ahorró ${m.ahorro.toFixed(2)} dólares, ` +
      `tiene préstamo de ${m.prestamo.toFixed(2)} dólares, ` +
      `con interés de ${m.interes.toFixed(2)} dólares. ` +
      `Saldo neto: ${m.saldo.toFixed(2)} dólares.`
    ).join(' Siguiente miembro. ');

    Speech.speak(`Resumen de ${resumen.length} miembros. ${texto}`, { language: 'es-MX' });
  };

  const detenerLectura = () => Speech.stop();

  const abrirModalTasa = (miembro, tasaActual) => {
    setMiembroSeleccionado(miembro);
    setNuevaTasa(tasaActual.toString());
    setModalVisible(true);
  };

  const guardarTasa = () => {
    const tasa = parseFloat(nuevaTasa);
    if (isNaN(tasa) || tasa < 0 || tasa > 100) {
      Alert.alert('Error', 'Ingresa un porcentaje válido entre 0 y 100.');
      return;
    }
    storage.setTasa(miembroSeleccionado, tasa);
    setModalVisible(false);
    calcularResumen();
  };

  const colorSaldo = (saldo) => {
    if (saldo > 0) return '#2E7D32';
    if (saldo < 0) return '#C62828';
    return '#555';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📊 Resumen de Miembros</Text>

      {/* Botones de lectura en voz alta */}
      <View style={styles.botonesLectura}>
        <TouchableOpacity style={styles.botonLeer} onPress={leerResumen}>
          <Text style={styles.botonLeerTexto}>🔊 Leer Resumen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonDetener} onPress={detenerLectura}>
          <Text style={styles.botonDetenerTexto}>⏹️ Detener</Text>
        </TouchableOpacity>
      </View>

      {resumen.length === 0 ? (
        <Text style={styles.vacio}>No hay transacciones registradas aún.</Text>
      ) : (
        <FlatList
          data={resumen}
          keyExtractor={(item) => item.miembro}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.nombre}>{item.miembro}</Text>
                <TouchableOpacity
                  style={styles.botonTasa}
                  onPress={() => abrirModalTasa(item.miembro, item.tasa)}
                >
                  <Text style={styles.botonTasaTexto}>Tasa: {item.tasa}% ✏️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>💚 Total Ahorrado</Text>
                <Text style={styles.valorVerde}>${item.ahorro.toFixed(2)}</Text>
              </View>
              <View style={styles.separador} />

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>💙 Total Prestado</Text>
                <Text style={styles.valorAzul}>${item.prestamo.toFixed(2)}</Text>
              </View>
              <View style={styles.separador} />

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>🟠 Interés ({item.tasa}%)</Text>
                <Text style={styles.valorNaranja}>${item.interes.toFixed(2)}</Text>
              </View>
              <View style={styles.separador} />

              <View style={styles.fila}>
                <Text style={styles.etiqueta}>⚖️ Saldo Neto</Text>
                <Text style={[styles.valorSaldo, { color: colorSaldo(item.saldo) }]}>
                  ${item.saldo.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>
              Tasa de interés para {miembroSeleccionado}
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              placeholder="Ej: 5.5"
              value={nuevaTasa}
              onChangeText={setNuevaTasa}
            />
            <Text style={styles.modalHint}>
              El interés se calcula sobre el monto prestado.
            </Text>
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarTasa}
              >
                <Text style={styles.botonGuardarTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5', marginTop: 40 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#2E7D32' },
  botonesLectura: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  botonLeer: { flex: 1, backgroundColor: '#7B1FA2', padding: 12, borderRadius: 10, alignItems: 'center' },
  botonLeerTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  botonDetener: { flex: 1, backgroundColor: '#555', padding: 12, borderRadius: 10, alignItems: 'center' },
  botonDetenerTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  vacio: { textAlign: 'center', color: '#AAA', marginTop: 50, fontSize: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nombre: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  botonTasa: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  botonTasaTexto: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  separador: { height: 1, backgroundColor: '#F0F0F0' },
  etiqueta: { fontSize: 15, color: '#555' },
  valorVerde: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },
  valorAzul: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },
  valorNaranja: { fontSize: 15, fontWeight: 'bold', color: '#E65100' },
  valorSaldo: { fontSize: 16, fontWeight: 'bold' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCaja: { backgroundColor: '#FFF', borderRadius: 16, padding: 25, width: '85%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#222' },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, fontSize: 18, marginBottom: 8 },
  modalHint: { fontSize: 12, color: '#888', marginBottom: 15 },
  modalBotones: { flexDirection: 'row', gap: 10 },
  botonCancelar: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  botonCancelarTexto: { color: '#555', fontWeight: 'bold' },
  botonGuardar: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#2E7D32', alignItems: 'center' },
  botonGuardarTexto: { color: '#FFF', fontWeight: 'bold' },
});
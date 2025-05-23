import React, { useState, useEffect } from 'react';
import EditReservationForm from './editReservationForm'; // Importamos el formulario

const dayNames = {
  L: 'Lunes',
  M: 'Martes',
  I: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
  D: 'Domingo',
};

const dayOrder = ['L', 'M', 'I', 'J', 'V', 'S', 'D'];

function translateDays(daysString) {
  const letters = daysString
    .toUpperCase()
    .replace(/[^LMIJVSD]/g, '')
    .split('');
  const sorted = [...new Set(letters)].sort(
    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
  );
  return sorted.map((char) => dayNames[char]).join(', ');
}

export default function ViewReservationsButton({ reservations, selectedCycle, selectedBuilding, fetchReservations }) {
  const [showPopup, setShowPopup] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null); // Nueva state para la reserva seleccionada

  useEffect(() => {
    if (Array.isArray(reservations)) {
      setFilteredReservations(reservations);
    } else {
      console.error('reservations no es un array');
    }
  }, [reservations]);

  const openPopup = async () => {
    if (fetchReservations) {
      await fetchReservations();
    }
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedReservation(null); // Cerrar y limpiar la reserva seleccionada
  };

  const handleModify = (res) => {
    setSelectedReservation(res); // Al presionar "Modificar", se selecciona la reserva
  };

  const handleSaveReservation = async (updatedReservation) => {
    try {
      const params = new URLSearchParams({
        originalSchedule: selectedReservation.schedule,
        cycle: selectedCycle,
        buildingName: selectedBuilding,
        originalProfessor: selectedReservation.professor,
        originalDate: selectedReservation.date,
        originalDuration: selectedReservation.duration,
        originalcreateInGoogleCalendar: selectedReservation.createInGoogleCalendar,
      });
      
      if (selectedReservation.googleEventId)
        params.append('originalGoogleEventId', selectedReservation.googleEventId);
      
      if (selectedReservation.googleEventId) {
        const authStatusRes = await fetch('/api/google/status');
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          console.log('>> Usuario no autenticado para modificar evento, redirigiendo...');
          window.location.href = 'http://localhost:3001/api/google/auth';
          return;
        }
      }
  
      const res = await fetch(`/api/reservations?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReservation)
      });
  
      if (!res.ok) throw new Error('Error al actualizar la reserva');
  
      alert('Reserva modificada correctamente');
  
      if (fetchReservations) await fetchReservations();
  
      closeEditForm();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al modificar la reserva');
    }
  };
  

  const deleteReservation = async (reservation) => {
    const params = new URLSearchParams({
      cycle: selectedCycle,
      buildingName: selectedBuilding,
      professor: reservation.professor,
      schedule: reservation.schedule,
      date: reservation.date,
    });

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la reserva de ${reservation.professor}?`);
    if (!confirmDelete) return;

    try {

      if (reservation.googleEventId) {
        const authStatusRes = await fetch('/api/google/status');
        const authStatus = await authStatusRes.json();
  
        if (!authStatus.authenticated) {
          console.log('>> Usuario no autenticado para borrar evento, redirigiendo...');
          window.location.href = 'http://localhost:3001/api/google/auth';
          return;
        }
      }

      const res = await fetch(`/api/reservations?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();
      alert(data.message);

      const updated = filteredReservations.filter(r =>
        !(
          r.professor === reservation.professor &&
          r.schedule === reservation.schedule &&
          r.date === reservation.date &&
          r.building === reservation.building
        )
      );
      setFilteredReservations(updated);
      fetchReservations();
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Hubo un error al eliminar la reserva.");
    }
  };

  const closeEditForm = () => {
    setSelectedReservation(null);
  };


  return (
    <>
      <button
        onClick={openPopup}
        className="bg-blue-500 rounded-full px-3 py-1 shadow-md text-white"
      >
        <b>Ver Reservas</b>
      </button>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={closePopup}>✖</button>
            <h3>Reservas para ciclo {selectedCycle}, edificio {selectedBuilding}:</h3>
            <hr style={{ margin: '10px 0 20px 0', borderTop: '2px solid #666' }} />

            {filteredReservations.length === 0 ? (
              <p>No se encontraron reservas para este ciclo y edificio.</p>
            ) : (
              <ul>
                {filteredReservations.map((res, idx) => (
                  <li key={idx}>
                    <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
                    <b>Profesor:</b> {res.professor}<br />
                    <b>Materia:</b> {res.course}<br />
                    <b>Edificio:</b> {res.building}<br />
                    <b>Clave:</b> {res.code}<br />
                    <b>Fecha:</b> {res.date} <br />
                    <b>Día:</b> {translateDays(res.days)}<br />
                    <b>Horario:</b> {res.schedule.replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/, "$1:$2 - $3:$4")}<br />
                    <b>Salón:</b> {res.classroom}<br />
                    <b>Duración:</b> {res.duration}<br />
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-md"
                        onClick={() => deleteReservation(res)}
                      >
                        Eliminar
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        onClick={() => handleModify(res)} // Abrir el formulario de modificación
                      >
                        Modificar
                      </button>
                    </div>
                    <hr style={{ margin: '10px 0', borderTop: '1px solid #aaa' }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Si se seleccionó una reserva, mostrar el formulario */}
      {selectedReservation && (
        <EditReservationForm
          reservation={selectedReservation}
          onSave={handleSaveReservation}
          onCancel={closeEditForm} // ← Solo cierra el formulario
          selectedBuilding={selectedBuilding}
        />
      )}
    </>
  );
}
import { useState, useEffect } from 'react';
import Sidebar from '../sidebar';
import CalendarLogic from './calendarLogic';
import Navbar from './navbar_calendar'; // Importa el nuevo componente
import ReserveButton from './reserveButton';
import './calendar.css'; // Importa el archivo de estilos CSS

export default function Calendar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCicle, setSelectedCicle] = useState('');
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [customReservations, setCustomReservations] = useState([]); // Este es el nuevo estado para las reservas

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const hours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });

  // Aquí es donde agregas la función handleReserve
  const handleReserve = (reservation) => {
    setCustomReservations(prev => [...prev, reservation]);
  };

  useEffect(() => {
    if (selectedBuilding) {
      const buildingFile = `data/classrooms/${selectedBuilding}.json`;
      fetch(buildingFile)
        .then(response => response.json())
        .then(data => setClassrooms(data))
        .catch(error => console.error("Error cargando los salones:", error));
    }
  }, [selectedBuilding]);

  useEffect(() => {
    const buildingFile = `data/buildings/${selectedBuilding}.json`;
    fetch(buildingFile)
      .then(response => response.json())
      .then(data => {
        if (data[selectedBuilding]) {
          setSchedule(data[selectedBuilding]);
        } else {
          console.error("No se encontró la clave para el edificio seleccionado.");
        }
      })
      .catch(error => console.error("Error cargando los horarios:", error));
  }, [selectedBuilding]);

  return (
    <div className="calendar-container">
      <Sidebar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} schedule={schedule} />
        <CalendarLogic
          onUpdateCicle={setSelectedCicle}
          onUpdateBuilding={setSelectedBuilding}
          onUpdateDay={setSelectedDay}
        />
        <div className="table-container">
          <table className="schedule-table">
            <thead>
              <tr className="table-header">
                <th className="table-cell">Hora</th>
                {classrooms.map((classroom, index) => (
                  <th key={index} className="table-cell">{classroom}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => {
                const [hourPart, period] = hour.split(' ');
                let currentHour = parseInt(hourPart.split(':')[0], 10);
                if (period === 'PM' && currentHour !== 12) currentHour += 12;
                if (period === 'AM' && currentHour === 12) currentHour = 0;

                return (
                  <tr key={hour} className="table-row">
                    <td className="table-cell font-semibold">{hour}</td>
                    {classrooms.map((classroom, index) => {
                      const matchingCourse = schedule.find(scheduleItem => {
                        const [startTime, endTime] = scheduleItem.data.schedule.split('-');
                        const startHour = parseInt(startTime.substring(0, 2), 10);
                        const endHour = parseInt(endTime.substring(0, 2), 10);
                        const days = scheduleItem.data.days.split(' ');
                        const isCourseOnSelectedDay = days.includes(selectedDay);
                        return (
                          currentHour >= startHour &&
                          currentHour <= endHour &&
                          scheduleItem.data.classroom === classroom &&
                          isCourseOnSelectedDay
                        );
                      }) || customReservations.find(reservation => {
                        const [startTime, endTime] = reservation.schedule.split('-');
                        const startHour = parseInt(startTime.substring(0, 2), 10);
                        const endHour = parseInt(endTime.substring(0, 2), 10);
                        const isCourseOnSelectedDay = reservation.days.includes(selectedDay);
                        return (
                          currentHour >= startHour &&
                          currentHour <= endHour &&
                          reservation.classroom === classroom &&
                          isCourseOnSelectedDay
                        );
                      });

                      const backgroundColor = matchingCourse
                        ? `hsl(${((matchingCourse.data?.course || matchingCourse.course)?.length + (matchingCourse.professor?.length || 0) * 17) * 37 % 360}, 80%, 75%)`
                        : 'white';

                      return (
                        <td key={index} 
                            className={`table-cell ${matchingCourse ? `occupied-cell course-color-${((matchingCourse.data?.course || matchingCourse.course)?.length % 15) + 1}` : 'empty-cell'}`}
                            style={{ backgroundColor }}>
                          {matchingCourse ? (matchingCourse.data?.course || matchingCourse.course) : <ReserveButton 
                                                                                      startHour={hour} 
                                                                                      endHour={hour + 1} 
                                                                                      day={selectedDay} 
                                                                                      building={selectedBuilding} 
                                                                                      classroom={classroom} 
                                                                                      onReserve={handleReserve} />}
                          <br/>
                          {matchingCourse ? matchingCourse.professor : ""}
                          <br/>
                          {matchingCourse ? `Clave: ${matchingCourse.data?.code || matchingCourse.code}` : ""}
                          <br/>
                          {matchingCourse ? `Alumnos: ${matchingCourse.data?.students || matchingCourse.students}` : ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

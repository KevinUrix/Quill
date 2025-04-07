export default function ReserveButton({ startHour, endHour, day, building, classroom, onReserve }) {
  const handleReserve = () => {
    // Generar enlace de Google Calendar
    const pad = (n) => n.toString().padStart(2, '0');
    const today = new Date();
    const dayIndex = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].indexOf(day);
    const currentDay = new Date();

    currentDay.setDate(today.getDate() + ((7 + dayIndex - today.getDay()) % 7));
    const year = currentDay.getFullYear();
    const month = pad(currentDay.getMonth() + 1);
    const date = pad(currentDay.getDate());

    const formatDate = (hour) => `${year}${month}${date}T${pad(hour)}0000Z`;

    const start = formatDate(startHour);
    const end = formatDate(endHour);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=Reserva+en+${classroom}` +
      `&dates=${start}/${end}` +
      `&details=Reserva+de+espacio+en+${building}+(${classroom})` +
      `&location=${building}+${classroom}`;

    // Abre Google Calendar
    window.open(url, '_blank');

    // Llama a la función del padre para registrar reserva local
    onReserve({
      course: 'Reserva Personal',
      professor: 'Usuario',
      classroom,
      code: 'Manual',
      students: 1,
      schedule: `${pad(startHour)}:00-${pad(endHour)}:00`,
      days: day
    });
  };

  return (
    <button className="reserve-button" onClick={handleReserve}>
      R
    </button>
  );
}

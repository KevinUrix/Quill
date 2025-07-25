import { toast } from 'sonner';

export const notifyReserva = (mensaje, reservation) => {
  toast.success(mensaje, {
    description: (
      <div>
        <p>📍 Edificio: {reservation.building} ({reservation.classroom}).</p>
        <p>📖 Profesor: {reservation.professor}.</p>
        {reservation.user && <p>👤 Usuario: {reservation.user}</p>}
      </div>
    ),
    style: {
      backgroundColor: '#16a34a', // indigo-700
      color: 'white',
      border: '1px solid #16a34a', // indigo-500
      fontSize: '1rem',
    },
    variant: 'default',
  });
};

export const notifyTicket = (mensaje, ticket) => {
  toast.success(mensaje, {
    description: (
    <div>
      <b>{ticket.title}</b>
      <p>Edificio: {ticket.building}.</p>
      <p>Prioridad: {ticket.priority}.</p>
      <p>Creado por: {ticket.created_by}.</p>
    </div>
    ),
    style: {
      backgroundColor: '#3949AB', // indigo-600
      color: 'white',
      border: '1px solid #3F51B5', // indigo-500
      fontSize: '1rem',
    },
    variant: 'default',
  });
};

export const notifyError = (mensaje) => {
  toast.error('❌ Error', {
    description: mensaje,
    className: 'bg-red-700 text-white border border-red-500',
    duration: 4000,
  });
};

export const notifyInfo = (mensaje) => {
  toast(mensaje, {
    className: 'bg-blue-800 text-white border border-blue-400',
    icon: 'ℹ️',
    duration: 3000,
  });
};

export const notifyWarn = (mensaje) => {
  toast.warning('⚠️ Advertencia', {
    description: mensaje,
    className: 'bg-yellow-600 text-black border border-yellow-400',
    duration: 4000,
  });
};

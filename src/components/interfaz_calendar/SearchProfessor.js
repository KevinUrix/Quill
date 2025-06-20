import { useState } from 'react';
import ProfessorSchedule from './professorSchedule';
import { toast } from 'react-toastify';

export default function SearchProfessor({ selectedCycle, selectedBuilding, selectedDay }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);

  const handleSearch = async () => {
    if (!selectedBuilding || !selectedCycle) {
      toast.error('Debes seleccionar un ciclo y un edificio para realizar la búsqueda.');
      return;
    }
    if (!searchTerm.trim()) {
      setFilteredSchedule([]);
      setShowPopup(false);
      return;
    }

    try {
      setIsLoadingPopup(true);
      const response = await fetch(`/api/search?name=${encodeURIComponent(searchTerm)}&cycle=${selectedCycle}&buildingName=${encodeURIComponent(selectedBuilding)}&day=${encodeURIComponent(selectedDay)}`);
      setIsLoadingPopup(false);

      if (!response.ok) {
        if (response.status === 400) {
          alert('Error de parámetros. Ingrese un valor válido para la búsqueda.');
        } else {
          console.error(`Error del servidor: ${response.error}`);
        }
        setFilteredSchedule([]);
        setShowPopup(false);
        return;
      }

      const data = await response.json();
      setFilteredSchedule(data);
      setShowPopup(true);
    } catch (error) {
      console.error("Error al buscar el profesor:", error);
      setFilteredSchedule([]);
      setIsLoadingPopup(false);
      setShowPopup(false);
    }
  };

  return (
    <>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar maestro..."
          className="search-input px-3 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="search-button ml-2 p-2 rounded bg-[#1e293b] hover:bg-[#506d9d] text-white"
          title="Buscar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
        </button>
      </div>

      {(isLoadingPopup || showPopup) && (
        <div className="popup-overlay" onClick={() => { if (!isLoadingPopup) setShowPopup(false); }}>
          <div className="popup-content relative p-6 bg-white border border-gray-300 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            {isLoadingPopup ? (
              <p className="text-lg font-semibold text-center">Espere un momento . . . ⏳</p>
            ) : (
              <>
                <button className="close-popup" onClick={() => setShowPopup(false)}>✖</button>
                <ProfessorSchedule professorSchedule={filteredSchedule} selectedCycle={selectedCycle} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";

/**
 * Composant de boîte de dialogue pour le rejet d'une demande
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.title - Le titre de la boîte de dialogue
 * @param {string} props.message - Le message à afficher
 * @param {function} props.onClose - Fonction appelée à la fermeture
 * @param {function} props.onConfirm - Fonction appelée à la confirmation avec la raison
 * @param {string} props.confirmText - Texte du bouton de confirmation (défaut: 'Rejeter')
 * @param {string} props.cancelText - Texte du bouton d'annulation (défaut: 'Annuler')
 */
function RejectDialog({
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Rejeter",
  cancelText = "Annuler",
}) {
  const [reason, setReason] = useState("");
  const inputRef = useRef(null);
  
  // Focus sur le champ de texte lors de l'ouverture
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Gérer la soumission
  const handleSubmit = () => {
    if (!reason.trim()) {
      // Mettre en évidence le champ si vide
      inputRef.current.classList.add("ring-2", "ring-red-500");
      setTimeout(() => {
        inputRef.current.classList.remove("ring-2", "ring-red-500");
      }, 2000);
      return;
    }
    
    onConfirm(reason);
  };
  
  // Gérer la touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="text-amber-500" size={24} />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 rounded-lg mb-4 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {message}
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Raison du rejet:
            </label>
            <textarea
              id="rejectReason"
              ref={inputRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Veuillez expliquer la raison du rejet..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[100px]"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-white rounded-lg transition-colors bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
              disabled={!reason.trim()}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RejectDialog;

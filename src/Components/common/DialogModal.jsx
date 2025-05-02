import React from "react";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

/**
 * Composant de boîte de dialogue réutilisable
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.title - Le titre de la boîte de dialogue
 * @param {string} props.message - Le message à afficher
 * @param {function} props.onClose - Fonction appelée à la fermeture
 * @param {function} props.onConfirm - Fonction appelée à la confirmation (optionnel)
 * @param {string} props.type - Type de dialogue: 'info', 'success', 'error', 'confirm' (défaut: 'info')
 * @param {string} props.confirmText - Texte du bouton de confirmation (défaut: 'OK')
 * @param {string} props.cancelText - Texte du bouton d'annulation (défaut: 'Annuler')
 */
function DialogModal({
  title,
  message,
  onClose,
  onConfirm,
  type = "info",
  confirmText = "OK",
  cancelText = "Annuler",
}) {
  // Déterminer l'icône et la couleur en fonction du type
  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="text-green-500" size={24} />,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
        };
      case "error":
        return {
          icon: <AlertTriangle className="text-red-500" size={24} />,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
        };
      case "confirm":
        return {
          icon: <AlertTriangle className="text-amber-500" size={24} />,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
        };
      case "info":
      default:
        return {
          icon: <Info className="text-blue-500" size={24} />,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-bold flex items-center gap-2 ${color}`}
            >
              {icon}
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${bgColor}`}>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {message}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            {type === "confirm" && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={type === "confirm" ? onConfirm : onClose}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                type === "error"
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                  : type === "confirm"
                    ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DialogModal;

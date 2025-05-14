import React from "react";
import { X, AlertTriangle, CheckCircle, Info, Shield } from "lucide-react";

/**
 * Composant de boîte de dialogue réutilisable avec design amélioré
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
          icon: <CheckCircle className="text-white" size={28} />,
          iconBg: "bg-gradient-to-r from-green-500 to-emerald-600",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          buttonColor:
            "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
        };
      case "error":
        return {
          icon: <AlertTriangle className="text-white" size={28} />,
          iconBg: "bg-gradient-to-r from-red-500 to-rose-600",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          buttonColor:
            "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
        };
      case "confirm":
        return {
          icon: <AlertTriangle className="text-white" size={28} />,
          iconBg: "bg-gradient-to-r from-amber-500 to-orange-600",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          buttonColor:
            "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
        };
      case "info":
      default:
        return {
          icon: <Info className="text-white" size={28} />,
          iconBg: "bg-gradient-to-r from-blue-500 to-indigo-600",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          buttonColor:
            "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
        };
    }
  };

  const { icon, iconBg, color, bgColor, buttonColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-scaleIn overflow-hidden">
        <div className="relative">
          {/* En-tête avec icône */}
          <div className="p-6 pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${iconBg} shadow-md`}>
                  {icon}
                </div>
                <h2 className={`text-xl font-bold ${color}`}>{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                  transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Corps du message */}
          <div className="p-6">
            <div
              className={`p-4 rounded-xl mb-6 ${bgColor} border border-${color.split("-")[1]}-100 dark:border-${color.split("-")[1]}-800/30`}
            >
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-2">
              {type === "confirm" && (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                    rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={type === "confirm" ? onConfirm : onClose}
                className={`px-5 py-2.5 text-white rounded-xl transition-all duration-300 font-medium shadow-sm hover:shadow ${buttonColor}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DialogModal;

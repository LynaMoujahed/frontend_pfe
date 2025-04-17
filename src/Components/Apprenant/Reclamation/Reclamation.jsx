import { useState } from 'react';
import { AlertCircle, Check, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

const ReclamationItem = ({ reclamation }) => (
  <div className="border rounded-lg overflow-hidden dark:border-slate-700">
    <div className={`p-4 ${
      reclamation.status === "resolved" 
        ? "bg-green-50 dark:bg-green-900/20" 
        : "bg-yellow-50 dark:bg-yellow-900/20"
    }`}>
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800 dark:text-white">{reclamation.subject}</h4>
        <div className="flex items-center gap-2">
          {reclamation.status === "resolved" ? (
            <Check className="text-green-600 dark:text-green-400" size={16} />
          ) : (
            <Clock className="text-yellow-600 dark:text-yellow-400" size={16} />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">{reclamation.date}</span>
        </div>
      </div>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{reclamation.message}</p>
    </div>
    
    {reclamation.response && (
      <div className="p-4 bg-gray-50 border-t dark:bg-slate-800 dark:border-slate-700">
        <h5 className="font-medium text-gray-800 dark:text-white">Réponse de l'admin:</h5>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{reclamation.response}</p>
      </div>
    )}
  </div>
);

ReclamationItem.propTypes = {
  reclamation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    response: PropTypes.string
  }).isRequired
};

const Reclamation = () => {
  const [reclamations, setReclamations] = useState([
    {
      id: 1,
      subject: "Problème avec un quiz",
      message: "Je n'arrive pas à soumettre mes réponses au quiz React",
      status: "resolved",
      date: "2023-05-10",
      response: "Le problème a été résolu. Merci de votre patience."
    },
    {
      id: 2,
      subject: "Question sur la certification",
      message: "Quand recevrai-je ma certification pour le cours JavaScript?",
      status: "pending",
      date: "2023-05-12",
      response: ""
    }
  ]);
  
  const [newReclamation, setNewReclamation] = useState({
    subject: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newReclamation.subject && newReclamation.message) {
      const newRec = {
        id: reclamations.length + 1,
        subject: newReclamation.subject,
        message: newReclamation.message,
        status: "pending",
        date: new Date().toLocaleDateString(),
        response: ""
      };
      setReclamations([newRec, ...reclamations]);
      setNewReclamation({ subject: "", message: "" });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Réclamations</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Sujet</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={newReclamation.subject}
            onChange={(e) => setNewReclamation({...newReclamation, subject: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={4}
            value={newReclamation.message}
            onChange={(e) => setNewReclamation({...newReclamation, message: e.target.value})}
            required
          />
        </div>
        
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Envoyer la réclamation
        </button>
      </form>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Historique</h3>
        
        {reclamations.length > 0 ? (
          reclamations.map(rec => (
            <ReclamationItem key={rec.id} reclamation={rec} />
          ))
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune réclamation</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vous n'avez pas encore soumis de réclamation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reclamation;
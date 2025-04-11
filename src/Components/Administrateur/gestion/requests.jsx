import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, ChevronDown,
  Check, X as XIcon, Clock, ChevronLeft, ChevronRight,
  Mail, User, Shield, GraduationCap
} from 'lucide-react';

const RegistrationRequestsPage = () => {
  // États
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 5;

  // Données simulées
  useEffect(() => {
    const mockRequests = [
      {
        id: 1,
        fullName: "Mohamed Ben Ali",
        email: "mohamed.benali@example.com",
        requestedRole: "formateur",
        status: "pending",
        requestDate: "2023-06-15T10:30:00",
        additionalInfo: "Enseignant en informatique avec 5 ans d'expérience"
      },
      {
        id: 2,
        fullName: "Salma Trabelsi",
        email: "salma.trabelsi@example.com",
        requestedRole: "apprenant",
        status: "pending",
        requestDate: "2023-06-16T14:45:00",
        additionalInfo: "Étudiante en développement web"
      },
      {
        id: 3,
        fullName: "Dr. Karim Jebali",
        email: "karim.jebali@example.com",
        requestedRole: "admin",
        status: "pending",
        requestDate: "2023-06-17T09:15:00",
        additionalInfo: "Responsable pédagogique"
      },
      {
        id: 4,
        fullName: "Amira Ksouri",
        email: "amira.ksouri@example.com",
        requestedRole: "apprenant",
        status: "approved",
        requestDate: "2023-06-10T11:20:00",
        approvedDate: "2023-06-12T16:30:00",
        assignedRole: "apprenant"
      },
      {
        id: 5,
        fullName: "Prof. Sami Bouaziz",
        email: "sami.bouaziz@example.com",
        requestedRole: "formateur",
        status: "rejected",
        requestDate: "2023-06-05T08:10:00",
        rejectedDate: "2023-06-07T14:00:00",
        rejectionReason: "Documents justificatifs manquants"
      }
    ];

    setRequests(mockRequests);
    setLoading(false);
  }, []);

  // Filtrage des demandes
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         request.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Changement de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Actions sur les demandes
  const approveRequest = (requestId, role) => {
    if (!role) {
      alert("Veuillez sélectionner un rôle avant d'accepter la demande");
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir accepter cette demande avec le rôle ${role} ?`)) {
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: 'approved',
              assignedRole: role,
              approvedDate: new Date().toISOString()
            } 
          : request
      ));
    }
  };

  const rejectRequest = (requestId) => {
    const reason = prompt("Veuillez saisir la raison du refus :");
    if (reason) {
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: 'rejected',
              rejectionReason: reason,
              rejectedDate: new Date().toISOString()
            } 
          : request
      ));
    }
  };

  // Rendu des icônes de rôle
  const renderRoleIcon = (role) => {
    switch(role) {
      case 'admin':
        return <Shield className="inline mr-1" size={16} />;
      case 'formateur':
        return <GraduationCap className="inline mr-1" size={16} />;
      case 'apprenant':
        return <User className="inline mr-1" size={16} />;
      default:
        return <User className="inline mr-1" size={16} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <UserPlus className="text-blue-600 dark:text-blue-400" size={24} />
            Demandes d'Inscription
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {filteredRequests.length} demande(s) trouvée(s)
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filtre par statut */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={18} />
            </div>
          </div>
        </div>
      </div>

     {/* Tableau */}
     <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center dark:text-gray-300">Chargement en cours...</div>
        ) : (
          <>
  <div className="rounded-lg overflow-hidden shadow">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Demandeur
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentRequests.length > 0 ? (
                    currentRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                                {request.fullName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {request.fullName}
                              </div>
                              {request.additionalInfo && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                                  {request.additionalInfo}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div className="flex items-center group relative">
                            <Mail className="mr-1 flex-shrink-0" size={14} />
                            <span className="truncate max-w-[120px] block">
                              {request.email}
                            </span>
                            {/* Tooltip qui apparaît au survol */}
                            {/* Tooltip modifié */}
    <div className="absolute ml-2 -top-3 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-lg">
      {request.email}
                              {/* Petite flèche pour le tooltip */}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-700"></div>                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            request.requestedRole === 'admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : request.requestedRole === 'formateur'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {request.requestedRole === 'admin' ? 'Admin' : 
                             request.requestedRole === 'formateur' ? 'Formateur' : 'Apprenant'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex items-center text-xs leading-4 font-semibold rounded-full ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {request.status === 'pending' ? (
                              <>
                                <Clock className="mr-1" size={12} />
                                En attente
                              </>
                            ) : request.status === 'approved' ? (
                              <>
                                <Check className="mr-1" size={12} />
                                Approuvée
                              </>
                            ) : (
                              <>
                                <XIcon className="mr-1" size={12} />
                                Rejetée
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => approveRequest(request.id, request.requestedRole)}
                                className="p-1 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors"
                                title="Accepter avec le rôle demandé"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => rejectRequest(request.id)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                title="Refuser"
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              Traitée
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Aucune demande trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredRequests.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} sur {totalPages} •{' '}
                  Affichage de <span className="font-medium">{indexOfFirstRequest + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(indexOfLastRequest, filteredRequests.length)}</span> sur{' '}
                  <span className="font-medium">{filteredRequests.length}</span> demandes
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md border flex items-center gap-1 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <ChevronLeft size={18} />
                    Précédent
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-8 h-8 rounded-md ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md border flex items-center gap-1 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Suivant
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default RegistrationRequestsPage;    
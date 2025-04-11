import { useState, useEffect } from "react";

// Composant principal de gestion des réclamations pour l'espace admin
function ReclamationSystem() {
    const [reclamations, setReclamations] = useState([]);
    const [selectedReclamation, setSelectedReclamation] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [showTemplates, setShowTemplates] = useState(false);

    // Données de test pour les réclamations
    const mockReclamations = [
        {
            id: 1,
            title: "Problème d'accès au cours de programmation",
            content:
                "Bonjour,\n\nDepuis hier, je n'arrive plus à accéder au contenu du cours de programmation avancée. Lorsque je clique sur le lien du cours, j'obtiens une erreur 404. J'ai essayé de me déconnecter et de me reconnecter, mais le problème persiste.\n\nPouvez-vous m'aider à résoudre ce problème ? Ce cours est essentiel pour mon projet final.\n\nMerci d'avance pour votre aide.",
            studentName: "Ahmed Benali",
            date: "2025-04-04T09:30:00.000Z",
            status: "new",
            attachments: [{ name: "capture_ecran_erreur.png", url: "#" }],
        },
        {
            id: 2,
            title: "Demande de prolongation pour le projet final",
            content:
                "Madame, Monsieur,\n\nJe vous contacte au sujet du projet final du module de développement web qui doit être rendu ce vendredi. En raison de problèmes de santé (certificat médical en pièce jointe), je n'ai pas pu avancer comme prévu sur mon projet.\n\nSerait-il possible d'obtenir un délai supplémentaire d'une semaine pour finaliser mon travail ?\n\nJe vous remercie par avance pour votre compréhension.\n\nCordialement,\nSamia Hakimi",
            studentName: "Samia Hakimi",
            date: "2025-04-03T14:15:00.000Z",
            status: "in-progress",
            attachments: [{ name: "certificat_medical.pdf", url: "#" }],
            replies: [
                {
                    id: 101,
                    content:
                        "Bonjour Samia,\n\nNous accusons réception de votre demande de prolongation. Nous examinons actuellement votre situation et reviendrons vers vous dans les plus brefs délais.\n\nCordialement,\nL'équipe administrative",
                    date: "2025-04-03T15:20:00.000Z",
                    fromAdmin: true,
                    isAutoReply: false,
                },
            ],
        },
        {
            id: 3,
            title: "Conflit d'horaire entre deux examens",
            content:
                "Bonjour,\n\nJe viens de constater que deux de mes examens sont programmés le même jour à la même heure (le 15 avril à 10h) : l'examen de Bases de données et celui de Réseaux informatiques.\n\nComment puis-je procéder pour résoudre ce conflit d'horaire ? Est-il possible de reprogrammer l'un des deux examens ?\n\nMerci pour votre aide,\nKarim Tazi",
            studentName: "Karim Tazi",
            date: "2025-04-02T11:45:00.000Z",
            status: "answered",
            replies: [
                {
                    id: 102,
                    content:
                        "Cher Karim,\n\nMerci d'avoir signalé ce conflit d'horaire. Après vérification, nous confirmons qu'il y a effectivement une erreur dans la programmation des examens.\n\nL'examen de Réseaux informatiques sera déplacé au 16 avril à 14h. Le calendrier des examens sera mis à jour dans les prochaines heures pour refléter ce changement.\n\nNous vous prions de nous excuser pour ce désagrément.\n\nCordialement,\nService des examens",
                    date: "2025-04-02T16:30:00.000Z",
                    fromAdmin: true,
                    isAutoReply: false,
                },
                {
                    id: 103,
                    content: "Merci beaucoup pour votre réponse rapide et pour la solution apportée.\n\nCordialement,\nKarim",
                    date: "2025-04-02T17:15:00.000Z",
                    fromAdmin: false,
                    isAutoReply: false,
                },
            ],
        },
        {
            id: 4,
            title: "Erreur dans la note du devoir de mathématiques",
            content:
                "Bonjour,\n\nJ'ai récemment reçu ma note pour le devoir de mathématiques appliquées (remis le 20 mars), et je pense qu'il y a une erreur dans l'évaluation. J'ai obtenu 12/20, mais après avoir comparé mes réponses avec les solutions publiées, je crois que ma note devrait être plus élevée.\n\nEn particulier, pour les exercices 3 et 5, mes réponses correspondent aux solutions, mais des points ont été déduits.\n\nSerait-il possible de faire réviser ma copie ?\n\nCordialement,\nFatima Alaoui",
            studentName: "Fatima Alaoui",
            date: "2025-04-01T10:20:00.000Z",
            status: "closed",
            attachments: [
                { name: "copie_devoir.pdf", url: "#" },
                { name: "calculs_detailles.pdf", url: "#" },
            ],
            replies: [
                {
                    id: 104,
                    content:
                        "Bonjour Fatima,\n\nNous avons bien reçu votre réclamation concernant votre note de mathématiques. Votre devoir sera réexaminé par le professeur responsable du cours.\n\nNous vous informerons du résultat de cette révision dès que possible.\n\nCordialement,\nService pédagogique",
                    date: "2025-04-01T14:45:00.000Z",
                    fromAdmin: true,
                    isAutoReply: false,
                },
                {
                    id: 105,
                    content:
                        "Chère Fatima,\n\nAprès révision de votre copie par le professeur, nous vous informons qu'une erreur a effectivement été constatée dans la notation. Votre note corrigée est de 16/20.\n\nLe relevé de notes en ligne sera mis à jour dans les 24 heures.\n\nNous vous remercions d'avoir porté ce problème à notre attention.\n\nCordialement,\nService pédagogique",
                    date: "2025-04-03T09:30:00.000Z",
                    fromAdmin: true,
                    isAutoReply: false,
                },
            ],
        },
        {
            id: 5,
            title: "Problème technique avec la plateforme de cours en ligne",
            content:
                "Bonjour,\n\nDepuis la mise à jour de la plateforme de cours en ligne effectuée ce week-end, je rencontre plusieurs problèmes :\n\n1. Les vidéos des cours ne se chargent pas correctement\n2. Impossible de télécharger les documents PDF\n3. Le forum de discussion affiche des erreurs\n\nJ'utilise Chrome sur Windows 11, et j'ai déjà essayé de vider le cache et les cookies.\n\nPouvez-vous m'aider à résoudre ces problèmes ?\n\nMerci,\nYoussef Mansouri",
            studentName: "Youssef Mansouri",
            date: "2025-03-31T16:10:00.000Z",
            status: "new",
            attachments: [
                { name: "erreur_video.png", url: "#" },
                { name: "erreur_forum.png", url: "#" },
            ],
        },
    ];

    // Modèles de réponses prédéfinis
    const replyTemplates = [
        {
            id: "template1",
            title: "Accusé de réception",
            content: `Bonjour ${selectedReclamation?.studentName},\n\nNous accusons réception de votre réclamation concernant "${selectedReclamation?.title}". Notre équipe examine actuellement votre demande et vous apportera une réponse dans les plus brefs délais.\n\nCordialement,\nL'équipe administrative`,
        },
        {
            id: "template2",
            title: "Demande d'informations supplémentaires",
            content: `Bonjour ${selectedReclamation?.studentName},\n\nNous avons bien reçu votre réclamation concernant "${selectedReclamation?.title}". Afin de traiter votre demande de manière efficace, nous aurions besoin d'informations supplémentaires. Pourriez-vous nous préciser les points suivants :\n- La date exacte de l'incident\n- Les personnes concernées\n- Tout document ou preuve pouvant appuyer votre réclamation\n\nNous vous remercions par avance pour votre collaboration.\n\nCordialement,\nL'équipe administrative`,
        },
        {
            id: "template3",
            title: "Résolution positive",
            content: `Bonjour ${selectedReclamation?.studentName},\n\nNous avons le plaisir de vous informer que votre réclamation concernant "${selectedReclamation?.title}" a été traitée avec succès. Les mesures nécessaires ont été prises pour résoudre le problème que vous avez signalé.\n\nNous vous remercions d'avoir porté ce sujet à notre attention et restons à votre disposition pour toute question supplémentaire.\n\nCordialement,\nL'équipe administrative`,
        },
        {
            id: "template4",
            title: "Résolution partielle",
            content: `Bonjour ${selectedReclamation?.studentName},\n\nSuite à votre réclamation concernant "${selectedReclamation?.title}", nous avons mis en place certaines mesures pour améliorer la situation. Cependant, certains aspects nécessitent un délai supplémentaire pour être entièrement résolus.\n\nNous continuons à travailler sur votre demande et vous tiendrons informé(e) de l'avancement.\n\nCordialement,\nL'équipe administrative`,
        },
    ];

    // Charger les données au démarrage
    useEffect(() => {
        // Simuler le chargement des données depuis une API
        setReclamations(mockReclamations);
    }, []);

    // Gérer la sélection d'une réclamation
    const handleSelectReclamation = (reclamation) => {
        setSelectedReclamation(reclamation);
    };

    // Gérer le changement de statut d'une réclamation
    const handleStatusChange = (id, newStatus) => {
        setReclamations(reclamations.map((rec) => (rec.id === id ? { ...rec, status: newStatus } : rec)));

        if (selectedReclamation && selectedReclamation.id === id) {
            setSelectedReclamation({ ...selectedReclamation, status: newStatus });
        }
    };

    // Gérer l'envoi d'une réponse
    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (replyContent.trim() && selectedReclamation) {
            const updatedReclamations = reclamations.map((rec) => {
                if (rec.id === selectedReclamation.id) {
                    const newReplies = [
                        ...(rec.replies || []),
                        {
                            id: Date.now(),
                            content: replyContent,
                            date: new Date().toISOString(),
                            isAutoReply: false,
                            fromAdmin: true,
                        },
                    ];
                    return {
                        ...rec,
                        replies: newReplies,
                        status: "answered",
                    };
                }
                return rec;
            });

            setReclamations(updatedReclamations);

            const newReplies = [
                ...(selectedReclamation.replies || []),
                {
                    id: Date.now(),
                    content: replyContent,
                    date: new Date().toISOString(),
                    isAutoReply: false,
                    fromAdmin: true,
                },
            ];

            setSelectedReclamation({
                ...selectedReclamation,
                replies: newReplies,
                status: "answered",
            });

            setReplyContent("");
        }
    };

    // Gérer la sélection d'un modèle de réponse
    const handleTemplateSelect = (template) => {
        setReplyContent(template.content);
        setSelectedTemplate(template.id);
        setShowTemplates(false);
    };

    // Générer une réponse automatique
    const handleGenerateReply = () => {
        if (!selectedReclamation) return;

        setIsGeneratingReply(true);
        // Simuler la génération d'une réponse automatique
        setTimeout(() => {
            const generatedReply = `Bonjour ${selectedReclamation.studentName},\n\nNous avons bien reçu votre réclamation concernant "${selectedReclamation.title}".\n\nAprès analyse de votre demande, nous pouvons vous confirmer que nous prenons en compte votre préoccupation et mettons tout en œuvre pour y apporter une solution adaptée.\n\nNous restons à votre disposition pour tout complément d'information.\n\nCordialement,\nL'équipe administrative`;
            setReplyContent(generatedReply);
            setIsGeneratingReply(false);
        }, 1500);
    };

    // Filtrer les réclamations selon le statut et le terme de recherche
    const filteredReclamations = reclamations
        .filter((rec) => filterStatus === "all" || rec.status === filterStatus)
        .filter(
            (rec) =>
                rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
        );

    // Formater une date
    const formatDate = (dateString) => {
        const options = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" };
        return new Date(dateString).toLocaleDateString("fr-FR", options);
    };

    // Obtenir le badge de statut pour une réclamation
    const getStatusBadge = (status) => {
        switch (status) {
            case "new":
                return (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Nouvelle
                    </span>
                );
            case "in-progress":
                return (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        En cours
                    </span>
                );
            case "answered":
                return (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        Répondue
                    </span>
                );
            case "closed":
                return (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Clôturée
                    </span>
                );
            default:
                return null;
        }
    };

    // Options de filtrage par statut
    const statusOptions = [
        { value: "all", label: "Toutes", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
        { value: "new", label: "Nouvelles", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
        { value: "in-progress", label: "En cours", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
        { value: "answered", label: "Répondues", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
        { value: "closed", label: "Clôturées", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
    ];

    return (
        <div className={`flex h-screen flex-col overflow-hidden ${darkMode ? "dark" : ""}`}>
            {/* Header */}
            <header className="border bg-white dark:border-transparent dark:bg-gray-800">
                {" "}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex flex-1 items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-indigo-600 dark:text-white">Gestion des Réclamations</h1>
                            </div>
                            <div className="ml-10 hidden flex-1 md:block">
                                <div className="relative w-full max-w-md">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Rechercher des réclamations..."
                                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700 md:hidden">
                    <div className="mt-3 px-4 sm:px-6">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher des réclamations..."
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenu principal */}
            <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                {/* Liste des réclamations */}
                <div className="m-4 flex w-full flex-col overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800 md:w-1/3">
                    <div className="border-b border-gray-200 px-4 py-5 dark:border-gray-700 sm:px-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Réclamations</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterStatus(option.value)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                        filterStatus === option.value
                                            ? `${option.color} ring-2 ring-indigo-500 ring-offset-2 dark:ring-indigo-400`
                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredReclamations.length === 0 ? (
                            <div className="py-10 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune réclamation</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Aucune réclamation ne correspond à vos critères de recherche.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredReclamations.map((reclamation) => (
                                    <li
                                        key={reclamation.id}
                                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            selectedReclamation?.id === reclamation.id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                                        }`}
                                        onClick={() => handleSelectReclamation(reclamation)}
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="truncate">
                                                    <div className="flex text-sm">
                                                        <p className="truncate font-medium text-indigo-600 dark:text-indigo-400">
                                                            {reclamation.title}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 flex">
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg
                                                                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            <p>{reclamation.studentName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-2 flex flex-shrink-0 flex-col items-end">
                                                    {getStatusBadge(reclamation.status)}
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(reclamation.date)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{reclamation.content}</p>
                                            </div>
                                            {reclamation.replies && reclamation.replies.length > 0 && (
                                                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <svg
                                                        className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>
                                                        {reclamation.replies.length} {reclamation.replies.length === 1 ? "réponse" : "réponses"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Détail de la réclamation */}
                {selectedReclamation ? (
                    <div className="m-4 flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-5 dark:border-gray-700 sm:px-6">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{selectedReclamation.title}</h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                    Soumise par {selectedReclamation.studentName} le {formatDate(selectedReclamation.date)}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative inline-block text-left">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => {
                                            const newStatus = selectedReclamation.status === "closed" ? "in-progress" : "closed";
                                            handleStatusChange(selectedReclamation.id, newStatus);
                                        }}
                                    >
                                        {selectedReclamation.status === "closed" ? "Rouvrir" : "Clôturer"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">{selectedReclamation.content}</p>
                                {selectedReclamation.attachments && selectedReclamation.attachments.length > 0 && (
                                    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
                                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Pièces jointes:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedReclamation.attachments.map((attachment, index) => (
                                                <a
                                                    key={index}
                                                    href="#"
                                                    className="flex items-center rounded-md border border-gray-200 bg-white p-2 text-sm text-indigo-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
                                                >
                                                    <svg
                                                        className="mr-1 h-4 w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                        />
                                                    </svg>
                                                    {attachment.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedReclamation.replies && selectedReclamation.replies.length > 0 && (
                                <div className="mb-6 space-y-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Historique des réponses:</h4>
                                    {selectedReclamation.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className={`rounded-lg p-4 ${
                                                reply.fromAdmin ? "ml-4 bg-indigo-50 dark:bg-indigo-900/20" : "mr-4 bg-gray-50 dark:bg-gray-700"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {reply.fromAdmin ? "Administration" : selectedReclamation.studentName}
                                                    {reply.isAutoReply && " (Réponse automatique)"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(reply.date)}</span>
                                            </div>
                                            <p className="mt-2 whitespace-pre-line text-gray-800 dark:text-gray-200">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                <form onSubmit={handleReplySubmit}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Répondre:</h4>
                                        <div className="flex space-x-2">
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                    onClick={() => setShowTemplates(!showTemplates)}
                                                >
                                                    <svg
                                                        className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                                    </svg>
                                                    Modèles
                                                </button>
                                                {showTemplates && (
                                                    <div className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                                                        <div
                                                            className="py-1"
                                                            role="menu"
                                                            aria-orientation="vertical"
                                                        >
                                                            {replyTemplates.map((template) => (
                                                                <button
                                                                    key={template.id}
                                                                    type="button"
                                                                    className={`block w-full px-4 py-2 text-left text-sm ${
                                                                        selectedTemplate === template.id
                                                                            ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                                                    }`}
                                                                    onClick={() => handleTemplateSelect(template)}
                                                                >
                                                                    {template.title}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                onClick={handleGenerateReply}
                                                disabled={isGeneratingReply}
                                            >
                                                {isGeneratingReply ? (
                                                    <>
                                                        <svg
                                                            className="-ml-1 mr-2 h-5 w-5 animate-spin text-gray-500 dark:text-gray-400"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        Génération...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        Générer une réponse
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <textarea
                                            rows={6}
                                            className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                                            placeholder="Rédigez votre réponse ici..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            disabled={!replyContent.trim()}
                                        >
                                            <svg
                                                className="-ml-1 mr-2 h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                            Envoyer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="m-4 flex flex-1 items-center justify-center rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="text-center">
                            <svg
                                className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucune réclamation sélectionnée</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Sélectionnez une réclamation dans la liste pour afficher les détails et y répondre.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReclamationSystem;

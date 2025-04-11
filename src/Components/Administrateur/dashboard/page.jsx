// Import des composants nécessaires depuis les bibliothèques recharts et lucide-react
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
    ArrowUp,
    ArrowDown,
    Book,
    ClipboardCheck,
    FileText,
    Users,
    MessageSquare,
    BookOpen,
    Award,
    Download,
    TrendingUp,
    Activity,
    BarChart2,
    PieChart as PieChartIcon,
} from "lucide-react";
import { useTheme } from "../../../hooks/use-theme";

// Données simulées pour le dashboard
const dashboardData = {
    stats: {
        totalUsers: { value: 1540, growth: 15 },        // Nombre total d'utilisateurs avec taux de croissance
        totalCourses: { value: 85, growth: 25 },       // Nombre total de cours avec taux de croissance
        totalQuizzes: { value: 420, growth: 12 },      // Nombre total de quiz avec taux de croissance
        evaluationsDone: { value: 3200, growth: 19 },  // Évaluations réalisées avec taux de croissance
        pendingEvaluations: { value: 42, growth: -5 },  // Évaluations en attente avec taux de croissance
    },
    recentEvaluations: [  // Liste des évaluations récentes
        { id: 1, apprenant: "Ahmed Ben Ali", cours: "Pharmacologie", status: "Satisfaisant", date: "2023-05-15" },
        { id: 2, apprenant: "Fatma Ksouri", cours: "Anatomie", status: "Non Satisfaisant", date: "2023-05-14" },
        { id: 3, apprenant: "Mohamed Trabelsi", cours: "Biologie", status: "Satisfaisant", date: "2023-05-14" },
        { id: 4, apprenant: "Samira Ben Ahmed", cours: "Chirurgie", status: "Satisfaisant", date: "2023-05-13" },
        { id: 5, apprenant: "Karim Jlassi", cours: "Pharmacologie", status: "Non Satisfaisant", date: "2023-05-12" },
    ],
    userDistribution: [    // Répartition des utilisateurs par rôle
        { role: "Administrateurs", count: 15 },
        { role: "Formateurs", count: 45 },
        { role: "Apprenants", count: 1480 },
    ],
    courseStats: [         // Statistiques des cours
        { course: "Pharmacologie", completions: 85, avgScore: 78 },
        { course: "Anatomie", completions: 72, avgScore: 82 },
        { course: "Biologie", completions: 68, avgScore: 75 },
        { course: "Chirurgie", completions: 54, avgScore: 80 },
        { course: "Physiologie", completions: 48, avgScore: 77 },
    ],
    evaluationTrend: [     // Tendance des évaluations par mois
        { month: "Jan", evaluations: 400 },
        { month: "Fév", evaluations: 300 },
        { month: "Mar", evaluations: 600 },
        { month: "Avr", evaluations: 800 },
        { month: "Mai", evaluations: 1100 },
    ],
};

// Couleurs utilisées pour les graphiques
const COLORS = ["#0ea5e9", "#10b981", "#1e40af", "#f59e0b", "#ef4444"];

// Composant pour afficher un badge de tendance (hausse/baisse)
const TrendBadge = ({ value }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${
            value >= 0
                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100"  // Style pour valeur positive
                : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100"          // Style pour valeur négative
        }`}
    >
        {value >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
        {Math.abs(value)}%
    </span>
);

// Composant principal du tableau de bord
const DashboardPage = () => {
    const { theme } = useTheme();  // Hook pour gérer le thème (clair/sombre)

    return (
        <div className="flex flex-col gap-y-5 dark:bg-gray-900 dark:text-white">
            {/* En-tête du tableau de bord */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:text-white">
                    Tableau de Bord Administrateur
                </h1>
                <div className="flex items-center gap-2">
                    <button className="flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg">
                        <Download size={18} />
                        <span>Exporter les données</span>
                    </button>
                </div>
            </div>

            {/* Section des cartes de statistiques */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Carte Apprenants */}
                <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 transition-all duration-300 group-hover:from-blue-500/30 group-hover:to-blue-600/30">
                            <Users size={24} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Apprenants</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.totalUsers.value}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <TrendBadge value={dashboardData.stats.totalUsers.growth} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>

                {/* Carte Cours */}
                <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 transition-all duration-300 group-hover:from-green-500/30 group-hover:to-green-600/30">
                            <BookOpen size={24} className="text-green-500 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cours</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.totalCourses.value}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <TrendBadge value={dashboardData.stats.totalCourses.growth} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>

                {/* Carte Quiz */}
                <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 transition-all duration-300 group-hover:from-purple-500/30 group-hover:to-purple-600/30">
                            <FileText size={24} className="text-purple-500 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quiz</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.totalQuizzes.value}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <TrendBadge value={dashboardData.stats.totalQuizzes.growth} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>

                {/* Carte Évaluations */}
                <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 transition-all duration-300 group-hover:from-orange-500/30 group-hover:to-orange-600/30">
                            <ClipboardCheck size={24} className="text-orange-500 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Évaluations</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.evaluationsDone.value}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <TrendBadge value={dashboardData.stats.evaluationsDone.growth} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>

                {/* Carte Évaluations en Attente */}
                <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 transition-all duration-300 group-hover:from-yellow-500/30 group-hover:to-yellow-600/30">
                            <MessageSquare size={24} className="text-yellow-500 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Attente</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.stats.pendingEvaluations.value}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <TrendBadge value={dashboardData.stats.pendingEvaluations.growth} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                </div>
            </div>

            {/* Première ligne de graphiques */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-1 lg:grid-cols-7">
                {/* Graphique de tendance des évaluations */}
                <div className="col-span-1 rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 md:col-span-2 lg:col-span-4">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                                <TrendingUp size={20} className="text-blue-500 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tendance des Évaluations</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Activity size={18} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData.evaluationTrend}>
                                <defs>
                                    <linearGradient id="colorEvaluations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="month" 
                                    stroke={theme === "light" ? "#475569" : "#ffffff"} 
                                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }} 
                                />
                                <YAxis 
                                    stroke={theme === "light" ? "#475569" : "#ffffff"} 
                                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }} 
                                />
                                <Tooltip
                                    formatter={(value) => [`${value} évaluations`, "Total"]}
                                    contentStyle={{
                                        backgroundColor: theme === "light" ? "#ffffff" : "#1f2937",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="evaluations"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorEvaluations)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graphique de répartition des utilisateurs */}
                <div className="col-span-1 rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 md:col-span-2 lg:col-span-3">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                                <PieChartIcon size={20} className="text-purple-500 dark:text-purple-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Répartition des Utilisateurs</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Download size={18} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dashboardData.userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="role"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {dashboardData.userDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="#fff"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value} utilisateurs`, "Nombre"]}
                                    contentStyle={{
                                        backgroundColor: theme === "light" ? "#ffffff" : "#1f2937",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Deuxième ligne de graphiques */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
                {/* Graphique de performance des cours */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                                <BarChart2 size={20} className="text-blue-500 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance des Cours</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Download size={18} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.courseStats}>
                                <XAxis 
                                    dataKey="course" 
                                    stroke={theme === "light" ? "#475569" : "#ffffff"} 
                                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }} 
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    stroke={theme === "light" ? "#475569" : "#ffffff"}
                                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke={theme === "light" ? "#475569" : "#ffffff"}
                                    tick={{ fill: theme === "light" ? "#475569" : "#ffffff" }}
                                />
                                <Tooltip
                                    formatter={(value, name) => (name === "Score Moyen" ? [`${value}%`, name] : [value, name])}
                                    contentStyle={{
                                        backgroundColor: theme === "light" ? "#ffffff" : "#1f2937",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    }}
                                />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="avgScore"
                                    name="Score Moyen"
                                    fill="#0ea5e9"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="completions"
                                    name="Complétions"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tableau des évaluations récentes */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                                <ClipboardCheck size={20} className="text-orange-500 dark:text-orange-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Évaluations Récentes</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Download size={18} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto dark:text-white">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 dark:text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Apprenant</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Cours</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Statut</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {dashboardData.recentEvaluations.map((evaluation) => (
                                        <tr
                                            key={evaluation.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-4 py-3 text-sm">{evaluation.apprenant}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.cours}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        evaluation.status === "Satisfaisant"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100"
                                                    }`}
                                                >
                                                    {evaluation.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{evaluation.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
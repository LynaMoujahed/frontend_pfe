import PropTypes from 'prop-types';
import { BookOpen, CheckCircle, Clock, BarChart2, Award, Calendar } from 'react-feather';

const StatCard = ({ title, value, description, progress, icon: Icon, iconBgColor, iconColor }) => (
  <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800 transition-all hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-full ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.3} />
        </div>
      )}
    </div>
    {progress && (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progression</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
  progress: PropTypes.number,
  icon: PropTypes.elementType,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string
};

const RecentActivityItem = ({ title, time, icon: Icon, status }) => (
  <div className="flex items-start py-3">
    <div className={`p-2.5 rounded-full mr-3 ${
      status === 'completed' 
        ? 'bg-green-100 dark:bg-green-900/20' 
        : 'bg-blue-100 dark:bg-blue-900/20'
    }`}>
      <Icon 
        className={`w-4 h-4 ${
          status === 'completed' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-blue-600 dark:text-blue-400'
        }`} 
        strokeWidth={2.5}
      />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-800 dark:text-white">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</p>
    </div>
  </div>
);

RecentActivityItem.propTypes = {
  title: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  status: PropTypes.oneOf(['completed', 'in-progress'])
};

const ProgressItem = ({ title, progress, color }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40 truncate">{title}</span>
    <div className="flex-1 mx-4">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
    <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right">{progress}%</span>
  </div>
);

ProgressItem.propTypes = {
  title: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired
};

const DeadlineItem = ({ title, date, module, color }) => (
  <div className={`border-l-4 ${color} pl-4 py-2 mb-3 last:mb-0`}>
    <h4 className="font-medium text-gray-800 dark:text-white">{title}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-300">Date limite: {date}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Module: {module}</p>
  </div>
);

DeadlineItem.propTypes = {
  title: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  module: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired
};

const Dashboard = () => {
  const stats = {
    coursesInProgress: 3,
    completedQuizzes: "12/15",
    certifications: 1,
    overallProgress: 68,
    upcomingDeadlines: 2
  };

  const recentActivities = [
    {
      title: "Quiz de Pharmacologie terminé",
      time: "Il y a 2 heures",
      icon: CheckCircle,
      status: "completed"
    },
    {
      title: "Nouveau cours disponible: BPF Avancé",
      time: "Aujourd'hui, 09:30",
      icon: BookOpen,
      status: "in-progress"
    },
    {
      title: "Échéance: Projet d'analyse clinique",
      time: "Demain, 14:00",
      icon: Clock,
      status: "in-progress"
    }
  ];

  const courseProgress = [
    {
      title: "Pharmacologie",
      progress: 75,
      color: "bg-blue-600"
    },
    {
      title: "Bonnes Pratiques de Fabrication",
      progress: 100,
      color: "bg-green-600"
    },
    {
      title: "Biotechnologie Pharmaceutique",
      progress: 30,
      color: "bg-yellow-500"
    }
  ];

  const deadlines = [
    {
      title: "Projet d'analyse clinique",
      date: "15/06/2023",
      module: "Pharmacologie Avancée",
      color: "border-blue-500"
    },
    {
      title: "Examen BPF",
      date: "20/06/2023",
      module: "Bonnes Pratiques de Fabrication",
      color: "border-purple-500"
    }
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de Bord</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <Calendar className="w-4 h-4 mr-1" strokeWidth={2} />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Cours en cours" 
          value={stats.coursesInProgress}
          icon={BookOpen}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard 
          title="Quiz complétés" 
          value={stats.completedQuizzes} 
          progress={(12/15)*100}
          icon={CheckCircle}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard 
          title="Certifications" 
          value={stats.certifications} 
          description={stats.certifications === 1 ? "1 certification obtenue" : "Aucune certification"}
          icon={Award}
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard 
          title="Progression globale" 
          value={`${stats.overallProgress}%`} 
          progress={stats.overallProgress}
          icon={BarChart2}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 bg-white rounded-lg shadow dark:bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Progression des Cours</h3>
          <div className="space-y-3">
            {courseProgress.map((course, index) => (
              <ProgressItem 
                key={index}
                title={course.title}
                progress={course.progress}
                color={course.color}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow dark:bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Activité Récente</h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivities.map((activity, index) => (
              <RecentActivityItem 
                key={index}
                title={activity.title}
                time={activity.time}
                icon={activity.icon}
                status={activity.status}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Prochaines Échéances</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {deadlines.map((deadline, index) => (
            <DeadlineItem 
              key={index}
              title={deadline.title}
              date={deadline.date}
              module={deadline.module}
              color={deadline.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import Certification from './Certification';
import PropTypes from 'prop-types';

const ProgressStat = ({ title, value, max, progressColor }) => (
  <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800 transition-transform hover:scale-[1.02]">
    <h3 className="text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
      {value}/{max}
    </p>
    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`} 
        style={{ width: `${(value/max)*100}%` }}
      />
    </div>
  </div>
);

ProgressStat.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  progressColor: PropTypes.string.isRequired
};

const Progression = () => {
  const stats = {
    totalCourses: 5,
    completedCourses: 2,
    totalQuizzes: 15,
    passedQuizzes: 12,
    certifications: 1
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ma Progression</h2>
      
      <div className="grid gap-6 md:grid-cols-3">
        <ProgressStat 
          title="Cours complétés" 
          value={stats.completedCourses} 
          max={stats.totalCourses} 
          progressColor="bg-green-600"
        />
        <ProgressStat 
          title="Quiz réussis" 
          value={stats.passedQuizzes} 
          max={stats.totalQuizzes} 
          progressColor="bg-blue-600"
        />
        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800 transition-transform hover:scale-[1.02]">
          <h3 className="text-gray-500 dark:text-gray-400">Certifications</h3>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
            {stats.certifications}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {stats.certifications === 1 ? "1 certification obtenue" : "Aucune certification"}
          </p>
        </div>
      </div>

      <Certification />
    </div>
  );
};

export default Progression;
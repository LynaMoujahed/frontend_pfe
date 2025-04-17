import PropTypes from 'prop-types';

const CourseCard = ({ course }) => (
  <div className="rounded-lg bg-white shadow dark:bg-slate-800 overflow-hidden transition-transform hover:scale-[1.02]">
    <div className="p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{course.title}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {course.category}
        </span>
      </div>
      
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{course.shortDescription}</p>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Progression</span>
          <span>{course.progress}%</span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <span>Quiz complétés:</span>
          <span>{course.completedQuizzes}/{course.totalQuizzes}</span>
        </div>
        
      </div>
      
      {course.validated && (
        <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Cours validé - Certification disponible
        </div>
      )}
    </div>
  </div>
);

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    shortDescription: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    completedQuizzes: PropTypes.number.isRequired,
    totalQuizzes: PropTypes.number.isRequired,
    validated: PropTypes.bool.isRequired
  }).isRequired
};

const Cours = () => {
  const courses = [
    {
      id: 1,
      title: "Bonnes Pratiques de Fabrication (BPF)",
      category: "Qualité",
      shortDescription: "Maîtrisez les standards de production pharmaceutique selon les normes internationales.",
      progress: 75,
      completedQuizzes: 3,
      totalQuizzes: 4,
      validated: false
    },
    {
      id: 2,
      title: "Pharmacovigilance Avancée",
      category: "Réglementation",
      shortDescription: "Systèmes de surveillance des médicaments et gestion des effets indésirables.",
      progress: 100,
      completedQuizzes: 5,
      totalQuizzes: 5,
      validated: true
    },
    {
      id: 3,
      title: "Biotechnologie Pharmaceutique",
      category: "Production",
      shortDescription: "Technologies modernes de production des médicaments biologiques.",
      progress: 30,
      completedQuizzes: 1,
      totalQuizzes: 6,
      validated: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mes Cours Pharmaceutiques</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {courses.filter(c => c.validated).length} validés sur {courses.length}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default Cours;
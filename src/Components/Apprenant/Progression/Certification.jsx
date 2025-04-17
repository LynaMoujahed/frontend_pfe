import { Download } from 'lucide-react';
import PropTypes from 'prop-types';

const CertificationCard = ({ certification }) => (
  <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-center">
      <div>
        <h4 className="font-medium text-gray-800 dark:text-white">{certification.course}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">Obtenue le {certification.date}</p>
      </div>
      <a 
        href={certification.downloadLink} 
        download
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 transition-colors"
      >
        <Download size={16} />
        Télécharger
      </a>
    </div>
  </div>
);

CertificationCard.propTypes = {
  certification: PropTypes.shape({
    id: PropTypes.number.isRequired,
    course: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    downloadLink: PropTypes.string.isRequired
  }).isRequired
};

const Certification = () => {
  const certifications = [
    {
      id: 1,
      course: "JavaScript Avancé",
      date: "15 Mai 2023",
      downloadLink: "/certifications/js-avance.pdf"
    }
  ];

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Mes Certifications</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {certifications.length} certification{certifications.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {certifications.length > 0 ? (
        <div className="space-y-4">
          {certifications.map(cert => (
            <CertificationCard key={cert.id} certification={cert} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune certification</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Complétez vos cours avec 100% de réussite pour obtenir des certifications.
          </p>
        </div>
      )}
    </div>
  );
};

export default Certification;
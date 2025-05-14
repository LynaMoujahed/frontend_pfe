import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { X, Save, Download } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/auth-context";
import { QuizService } from "../../services/QuizService";

const CertificateDisplay = ({
  isOpen,
  onClose,
  certificateData,
  onSave,
  forceDownloadButton = false,
}) => {
  const [saving, setSaving] = useState(false);
  const initialCertificateDataRef = useRef(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (isOpen && certificateData) {
      initialCertificateDataRef.current = certificateData;
    }
  }, [isOpen, certificateData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await onSave();

      if (result && result.certificat) {
        toast.success("Certificat enregistré avec succès !", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Fermer automatiquement la fenêtre du certificat après un court délai
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.warning(
          "Le certificat a été traité mais n'a pas été correctement enregistré",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du certificat:", error);
      toast.error("Erreur lors de l'enregistrement du certificat", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      // Toujours mettre fin à l'état de chargement
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  // Fonction pour télécharger le certificat en PDF
  const handleDownload = async () => {
    try {
      console.log(
        "Données du certificat pour téléchargement PDF:",
        certificateData
      );

      // Afficher un toast pour indiquer que le téléchargement est en cours
      toast.info("Préparation du certificat en PDF...", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Utiliser les données du certificat affichées (qui peuvent être les données initiales)
      const dataToUse = displayData || certificateData;

      if (!dataToUse || !dataToUse.apprenant || !dataToUse.cours) {
        console.error("Données du certificat incomplètes:", dataToUse);
        throw new Error("Données du certificat incomplètes");
      }

      // Si le certificat n'a pas d'ID (n'est pas encore enregistré), l'enregistrer d'abord
      if (!dataToUse.id) {
        try {
          console.log("Enregistrement du certificat avant téléchargement");
          setSaving(true);
          const result = await onSave();

          if (result && result.certificat) {
            console.log(
              "Certificat enregistré avec succès avant téléchargement:",
              result.certificat
            );
            toast.success("Certificat enregistré avec succès !", {
              position: "top-right",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });

            // Utiliser les données du certificat enregistré pour le PDF
            dataToUse.id = result.certificat.id;
          } else {
            console.warn(
              "Le certificat a été traité mais n'a pas été correctement enregistré"
            );
          }
        } catch (saveError) {
          console.error(
            "Erreur lors de l'enregistrement du certificat:",
            saveError
          );
          toast.error("Erreur lors de l'enregistrement du certificat", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          // Continuer quand même avec le téléchargement
        } finally {
          setSaving(false);
        }
      }

      // Générer directement le PDF avec les données actuelles
      try {
        console.log("Génération du PDF avec les données actuelles", dataToUse);
        await QuizService.downloadCertificatPDF(dataToUse);

        toast.success("Certificat téléchargé avec succès en PDF!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        return; // Sortir de la fonction si réussi
      } catch (pdfError) {
        console.error("Erreur lors de la génération PDF:", pdfError);
        // Si tout échoue, afficher un message d'erreur
        toast.error(
          "Impossible de générer le PDF du certificat. Veuillez réessayer.",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement du certificat:", error);
      toast.error(
        "Erreur lors du téléchargement du certificat. Veuillez réessayer.",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }
  };

  // Utiliser les données initiales si disponibles, sinon utiliser les données actuelles
  const displayData = initialCertificateDataRef.current || certificateData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Contenu du certificat */}
        <div className="p-4 bg-amber-100 relative">
          <div className="absolute inset-0 border-[12px] border-double border-amber-900/20 pointer-events-none"></div>
          <div className="relative z-0 p-6 text-center bg-white rounded-lg shadow-sm border border-amber-200">
            {/* En-tête du certificat avec coins décoratifs */}
            <div className="relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-amber-900"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-amber-900"></div>

              <h1 className="text-3xl font-serif text-amber-900 mb-1 pt-4">
                CERTIFICAT
              </h1>
              <h2 className="text-lg text-amber-900 font-medium">
                D'ACCOMPLISSEMENT
              </h2>
              <div className="w-32 h-1 bg-amber-900 mx-auto my-3"></div>
            </div>

            {/* Corps du certificat */}
            <div className="mb-6">
              <p className="text-base mb-4 text-amber-700">
                Ce certificat est fièrement présenté à :
              </p>
              <div className="relative inline-block mb-6">
                <h3 className="text-2xl font-serif text-amber-800 font-bold italic relative z-10">
                  {displayData?.apprenant?.name || ""}
                </h3>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-200 -z-0 -mb-1"></div>
              </div>

              <p className="text-base mb-4 text-amber-700">
                Pour avoir complété avec succès le cours :
              </p>
              <div className="relative inline-block mb-6">
                <h4 className="text-xl font-medium text-amber-800 relative z-10">
                  {displayData?.cours?.titre || ""}
                </h4>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-200 -z-0 -mb-1"></div>
              </div>

              <p className="text-sm mb-4 max-w-xl mx-auto text-gray-700 leading-relaxed">
                Ce certificat atteste que l'apprenant a acquis toutes les
                compétences et connaissances requises pour ce cours, démontrant
                ainsi son engagement et sa maîtrise du sujet.
              </p>

              {/* Afficher un message si le certificat a été généré automatiquement */}
              {displayData?.isAutoGenerated && (
                <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-md p-2 mb-4 mx-auto max-w-md">
                  Ce certificat a été généré automatiquement lorsque le cours a
                  atteint 100% de progression.
                </div>
              )}

              {/* Afficher un message pour les formateurs */}
              {user && user.role === "formateur" && (
                <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2 mb-4 mx-auto max-w-md">
                  Ce certificat est disponible pour l'apprenant dans son espace
                  personnel.
                </div>
              )}

              {/* Les sections "Compétences acquises" et "Numéro de certificat" ont été supprimées */}
            </div>

            {/* Pied de page du certificat */}
            <div className="flex justify-between items-center mt-8 relative">
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-amber-900"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-amber-900"></div>

              <div className="text-left flex items-center">
                <div className="mr-2 bg-amber-100 rounded-full p-1 border border-amber-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-amber-900"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19.5 5.5L18 7l1.5 1.5a9 9 0 11-11 0L10 7 8.5 5.5a11 11 0 0110.5 0z" />
                    <path d="M15 11a3 3 0 11-3.17 3L9 16l-1.5-3 1.5-3 2.83 2a3.001 3.001 0 013.17-1z" />
                  </svg>
                </div>
                <div>
                  <div className="w-24 h-px bg-amber-900 mb-1"></div>
                  <p className="text-xs text-amber-900 font-semibold">
                    PharmaLearn
                  </p>
                  <p className="text-xs text-amber-900">
                    Certification officielle
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-amber-900 mb-1">
                  Date de délivrance
                </p>
                <p className="text-xs font-medium text-amber-900">
                  {formatDate(displayData?.date_obtention)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white p-3 flex justify-between items-center border-t border-gray-200">
          {/* Message pour les formateurs */}
          {user && user.role === "formateur" && (
            <div className="text-sm text-blue-600 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>
                Ce certificat est disponible pour l'apprenant dans son espace
                personnel
              </span>
            </div>
          )}

          <div className="flex space-x-2">
            {/* Bouton Enregistrer uniquement pour les formateurs et si le certificat n'a pas d'ID */}
            {user && user.role === "formateur" && !displayData.id && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors flex items-center shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Enregistrement...
                  </span>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            )}

            {/* Bouton Télécharger pour tout le monde */}
            {certificateData && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors flex items-center shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Téléchargement...
                  </span>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Télécharger
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CertificateDisplay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  certificateData: PropTypes.shape({
    id: PropTypes.number,
    date_obtention: PropTypes.string,
    isAutoGenerated: PropTypes.bool,
    apprenant: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }),
    cours: PropTypes.shape({
      id: PropTypes.number,
      titre: PropTypes.string,
    }),
  }),
  onSave: PropTypes.func.isRequired,
  forceDownloadButton: PropTypes.bool,
};

export default CertificateDisplay;

import React, { useEffect, useState } from "react";
import { QuizService } from "../../services/QuizService";

const ApprenantCours = () => {
  const [coursData, setCoursData] = useState([]);
  const [
    completedCoursesWithoutCertificates,
    setCompletedCoursesWithoutCertificates,
  ] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [apprenant, setApprenant] = useState(null);

  useEffect(() => {
    const checkCertificates = async () => {
      if (completedCoursesWithoutCertificates.length > 0 && apprenant) {
        console.log(
          "DEBUG: Cours complétés sans certificat détectés:",
          completedCoursesWithoutCertificates.map((c) => c.id)
        );

        // Nous ne générons plus automatiquement les certificats,
        // mais nous pouvons vérifier s'ils existent déjà
        for (const course of completedCoursesWithoutCertificates) {
          try {
            console.log(
              `DEBUG: Vérification de certificat existant pour le cours ${course.id}`
            );
            const result = await QuizService.checkCertificate(
              localStorage.getItem("token"),
              apprenant.id,
              course.id
            );

            if (result && result.certificat) {
              console.log(
                "DEBUG: Certificat existant trouvé:",
                result.certificat
              );
              // Mettre à jour l'état local avec le certificat existant
              setCoursData((prevData) =>
                prevData.map((c) =>
                  c.id === course.id
                    ? {
                        ...c,
                        certificat: {
                          id: result.certificat.id,
                          apprenant_id: result.certificat.apprenant_id,
                          date_obtention: result.certificat.date_obtention,
                          contenu: result.certificat.contenu,
                        },
                      }
                    : c
                )
              );
            } else if (result && result.message) {
              console.log("DEBUG: Message du serveur:", result.message);
            }
          } catch (error) {
            console.error(
              `DEBUG: Erreur lors de la vérification du certificat pour le cours ${course.id}:`,
              error
            );
          }
        }
      }
    };

    if (apprenant && apprenant.id) {
      checkCertificates();
    }
  }, [completedCoursesWithoutCertificates, apprenant]);

  return <div>{/* Render your component content here */}</div>;
};

export default ApprenantCours;

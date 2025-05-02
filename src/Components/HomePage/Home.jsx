import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import Carousel from "../Carousel/Carousel";
import aboutUsImage from "../../assets/Medicine-bro.png";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
  const services = [
    {
      title: "Suivi de Progression",
      description: "Suivez les performances des stagiaires en temps réel.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      title: "Évaluation par Quiz",
      description: "Évaluez les apprenants avec des quiz interactifs.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Certificats Automatisés",
      description: "Délivrez des certificats à la fin des formations.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      title: "Notifications",
      description:
        "Envoyez des alertes automatiques pour les mises à jour importantes.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
    {
      title: "Messagerie",
      description:
        "Permettez une communication directe entre les utilisateurs.",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 w-full">
        <section id="hero" className="relative">
          <Carousel />
        </section>

        <div className="w-full px-4 sm:px-6 py-12 mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Bienvenue sur PharmaLearn
            </motion.h2>
            <motion.p
              className="mt-4 text-xl text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Des solutions de formation innovantes conçues pour l'industrie
              pharmaceutique.
            </motion.p>
          </div>
        </div>

        <section
          id="about"
          className="w-full px-4 sm:px-6 py-16 mx-auto max-w-7xl"
        >
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={aboutUsImage}
                alt="PharmaLearn team"
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </motion.div>
            <motion.div
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                À propos de nous
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Notre plateforme simplifie l'évaluation des stagiaires dans le
                secteur pharmaceutique, permettant aux formateurs d'évaluer les
                apprenants et de suivre leurs progrès de manière fluide.
              </p>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Développée par des experts en formation pharmaceutique,
                PharmaLearn offre une solution complète pour la gestion des
                compétences et la certification des apprenants.
              </p>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Rejoignez-nous
                  <svg
                    className="ml-2 -mr-1 w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section
          id="services"
          className="w-full px-4 sm:px-6 py-16 mx-auto max-w-7xl"
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Nos Services
            </motion.h2>
            <motion.p
              className="mt-4 text-xl text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Des solutions complètes pour la formation pharmaceutique
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            {services.slice(0, 3).map((service, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {services.slice(3, 5).map((service, index) => (
              <motion.div
                key={index + 3}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all sm:w-1/2 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section
          id="testimonials"
          className="w-full px-4 sm:px-6 py-16 mx-auto max-w-7xl"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <motion.h2
                className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
                initial={{ y: -20 }}
                whileInView={{ y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Témoignages
              </motion.h2>
              <motion.p
                className="mt-4 text-xl text-gray-500 dark:text-gray-400"
                initial={{ y: -20 }}
                whileInView={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Ce que nos formateurs et stagiaires disent de nous
              </motion.p>
            </div>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
            <motion.div
              className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <motion.svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
              </div>
              <motion.p
                className="text-gray-600 dark:text-gray-300 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                "PharmaLearn a révolutionné notre façon de former. La plateforme
                est intuitive et nous permet de suivre précisément la
                progression de chaque stagiaire."
              </motion.p>
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">
                    PD
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Pierre Dubois
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Formateur en Pharmacologie
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <motion.svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
              </div>
              <motion.p
                className="text-gray-600 dark:text-gray-300 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                "Grâce à PharmaLearn, j'ai pu me former à mon rythme. Les quiz
                interactifs et les certificats automatisés sont un vrai plus !"
              </motion.p>
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-300 font-bold">
                    ML
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Marie Lambert
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Stagiaire en Pharmacie
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                type: "spring",
                stiffness: 100,
                damping: 10,
              }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <motion.svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
              </div>
              <motion.p
                className="text-gray-600 dark:text-gray-300 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                "La gestion des certificats automatisée nous fait gagner un
                temps précieux. Une plateforme parfaitement adaptée au secteur
                pharmaceutique."
              </motion.p>
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-300 font-bold">
                    AD
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Amélie Durand
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Responsable Formation
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;

import { useState, useCallback } from 'react';
import { Header } from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";
import Layout from './Layout/Layout';
import Dashboard from './Dashboard/Dashboard';
import Cours from './Cours/Cours';
import Progression from './Progression/Progression';
import Messagerie from './Messagerie/Messagerie';
import Reclamation from './Reclamation/Reclamation';
import Profile from './Profile/Profile';
import { Routes, Route } from 'react-router-dom';

const ApprenantPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Nouveau message de votre formateur",
      read: false,
      type: "message"
    },
    {
      id: 2,
      message: "Votre certification BPF est disponible",
      read: false,
      type: "certification"
    }
  ]);

  const markAsRead = useCallback((id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ));
  }, [notifications]);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar collapsed={collapsed} />
      <div className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-64"}`}>
        <Header 
          collapsed={collapsed} 
          setCollapsed={setCollapsed}
          notifications={notifications}
          onNotificationRead={markAsRead}
        />
        <Layout>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="cours" element={<Cours />} />
            <Route path="progression" element={<Progression />} />
            <Route path="messagerie" element={<Messagerie />} />
            <Route path="reclamation" element={<Reclamation />} />
            <Route path="profile" element={<Profile />} />

            
          </Routes>
        </Layout>
      </div>
    </div>
  );
};

export default ApprenantPage;
import { useEffect, useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { TVChartContainer } from './components/Chart/TVChartContainer';
import { IndicatorModal } from './components/Indicators/IndicatorModal';
import { HelpPage } from './components/Docs/HelpPage';
import { useStore } from './store/useStore';
import { generateSampleData } from './utils/generateData';

function App() {
  const { setData, setEvents } = useStore();

  useEffect(() => {
    // Load sample data on start
    const { data, events } = generateSampleData(500);
    setData(data);
    setEvents(events);
  }, [setData, setEvents]);

  const [currentRoute, setCurrentRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentRoute === '#help') {
    return <HelpPage />;
  }

  return (
    <MainLayout>
      <TVChartContainer />
      <IndicatorModal />
    </MainLayout>
  );
}

export default App;

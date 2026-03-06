import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Layout
import Topbar from './components/layout/Topbar';

// Panels
import ThreatMapPanel from './components/panels/ThreatMapPanel';
import AlertsPanel from './components/panels/AlertsPanel';
import TelemetryTerminal from './components/panels/TelemetryTerminal';
import DemoControlPanel from './components/panels/DemoControlPanel';
import TimelinePanel from './components/panels/TimelinePanel';
import IoTMapPanel from './components/panels/IoTMapPanel';
import ResponseStatusPanel from './components/panels/ResponseStatusPanel';
import DroppedPacketsPanel from './components/panels/DroppedPacketsPanel';

// Charts
import TelemetryChart from './components/charts/TelemetryChart';

// Hooks
import { useTelemetry } from './hooks/useTelemetry';
import { useAlerts } from './hooks/useAlerts';
import { useDroppedPackets } from './hooks/useDroppedPackets';
import { useScenarios } from './hooks/useScenarios';

// Services
import { getSocket, disconnectSocket } from './services/socket';

const TABS = [
  { key: 'telemetry', label: 'Telemetry' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'iot', label: 'IoT Fleet' },
  { key: 'response', label: 'Response' },
  { key: 'dropped', label: 'Dropped' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [showDemo, setShowDemo] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeMetrics, setActiveMetrics] = useState(['cpu', 'memory', 'network']);
  const [timelineEvents, setTimelineEvents] = useState([]);

  // Hooks
  const telemetry = useTelemetry();
  const alerts = useAlerts();
  const droppedPackets = useDroppedPackets();

  // Scenario callbacks
  const handleScenarioTelemetry = useCallback(() => {
    // Telemetry is handled by the socket hook
  }, []);

  const handleScenarioAlert = useCallback((alert) => {
    // Alerts feed into the alerts hook via socket
  }, []);

  const handleTimelineEvent = useCallback((event) => {
    setTimelineEvents(prev => [event, ...prev].slice(0, 100));
  }, []);

  const scenarios = useScenarios(handleScenarioTelemetry, handleScenarioAlert, handleTimelineEvent);

  // Socket connection status
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onConnectError = () => setConnectionStatus('degraded');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Check initial state
    if (socket.connected) setConnectionStatus('connected');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  const handleToggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const topbarStats = {
    eventsPerMin: telemetry.eventsPerMin,
    activeAlerts: alerts.stats.active,
    blockedCount: droppedPackets.totalDropped,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-900 overflow-hidden">
      {/* Topbar */}
      <Topbar
        connectionStatus={connectionStatus}
        stats={topbarStats}
        onToggleDemo={() => setShowDemo(v => !v)}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar — Threat Map */}
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-56 flex-shrink-0 border-r border-white/5 p-3 overflow-hidden"
        >
          <ThreatMapPanel
            devices={telemetry.devices}
            activeDevice={telemetry.activeDevice}
            onSelectDevice={telemetry.setActiveDevice}
          />
        </motion.aside>

        {/* Center */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-2 flex-shrink-0">
            {TABS.map((tab) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeTab === tab.key ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 px-4 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full glass-card p-4"
              >
                {activeTab === 'telemetry' && (
                  <TelemetryChart
                    data={telemetry.telemetryData}
                    activeMetrics={activeMetrics}
                    onToggleMetric={handleToggleMetric}
                  />
                )}
                {activeTab === 'timeline' && (
                  <TimelinePanel events={timelineEvents} />
                )}
                {activeTab === 'iot' && (
                  <IoTMapPanel />
                )}
                {activeTab === 'response' && (
                  <ResponseStatusPanel />
                )}
                {activeTab === 'dropped' && (
                  <DroppedPacketsPanel
                    packets={droppedPackets.packets}
                    stats={droppedPackets.stats}
                    totalDropped={droppedPackets.totalDropped}
                    onRefresh={droppedPackets.refresh}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom — Telemetry Terminal */}
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="h-40 flex-shrink-0 px-4 pb-3"
          >
            <TelemetryTerminal
              events={telemetry.rawEvents}
              isPaused={telemetry.isPaused}
              onTogglePause={telemetry.togglePause}
            />
          </motion.div>
        </div>

        {/* Right Sidebar — Alerts */}
        <motion.aside
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-72 flex-shrink-0 border-l border-white/5 p-3 overflow-hidden"
        >
          <AlertsPanel
            alerts={alerts.alerts}
            filter={alerts.filter}
            setFilter={alerts.setFilter}
            onAcknowledge={alerts.acknowledgeAlert}
            onAcknowledgeAll={alerts.acknowledgeAll}
            stats={alerts.stats}
          />
        </motion.aside>
      </div>

      {/* Demo Control Panel Overlay */}
      <DemoControlPanel
        isOpen={showDemo}
        onClose={() => setShowDemo(false)}
        scenarios={scenarios.scenarios}
        activeScenario={scenarios.activeScenario}
        isRunning={scenarios.isRunning}
        progress={scenarios.progress}
        onRunScenario={scenarios.runScenario}
        onStopScenario={scenarios.stopScenario}
      />
    </div>
  );
}

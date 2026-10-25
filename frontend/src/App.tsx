import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchDockerStatus,
  fetchContainers,
  fetchImages,
  fetchContainerDetail,
  fetchImageDetail,
  executeContainerAction,
} from './services/api';
import {
  DockerStatus,
  ContainerSummary,
  ImageSummary,
  ComposeServiceConfig,
  ConsoleEvent,
} from './types';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { TopToolbar } from './components/layout/TopToolbar';
import { DiagnosticConsole } from './components/layout/DiagnosticConsole';
import { DetailsSlideOver, SelectedItem } from './components/details/DetailsSlideOver';
import { OverviewView } from './features/overview/OverviewView';
import { ContainersView } from './features/containers/ContainersView';
import { ImagesView } from './features/images/ImagesView';
import { ComposeView } from './features/compose/ComposeView';
import { DiagnosticsView } from './features/diagnostics/DiagnosticsView';
import { LogsView } from './features/logs/LogsView';
import { SettingsView } from './features/settings/SettingsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [dockerStatus, setDockerStatus] = useState<DockerStatus | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [containersLoading, setContainersLoading] = useState<boolean>(false);
  const [containersError, setContainersError] = useState<string | null>(null);

  const [images, setImages] = useState<ImageSummary[]>([]);
  const [imagesLoading, setImagesLoading] = useState<boolean>(false);
  const [imagesError, setImagesError] = useState<string | null>(null);

  // Selected item for right details panel
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  // Preselected container for logs view
  const [logContainerId, setLogContainerId] = useState<string | null>(null);

  // Bottom console events log
  const [consoleEvents, setConsoleEvents] = useState<ConsoleEvent[]>([]);

  const addConsoleEvent = useCallback(
    (
      category: ConsoleEvent['category'],
      type: ConsoleEvent['type'],
      message: string
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setConsoleEvents((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          category,
          type,
          message,
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const now = new Date();
    setLastRefreshed(now.toLocaleTimeString());

    try {
      // 1. Fetch Docker Status
      const status = await fetchDockerStatus();
      setDockerStatus(status);

      // If docker is not connected and user hasn't explicitly chosen live mode, enable demo mode
      const useDemo = isDemoMode || !status.connected;
      if (!status.connected && !isDemoMode) {
        addConsoleEvent('Docker', 'warn', 'Docker Engine is disconnected. You can switch to Demo Sandbox.');
      } else if (status.connected) {
        addConsoleEvent('Docker', 'success', `Connected to Docker Engine ${status.version}`);
      }

      // 2. Fetch Containers
      setContainersLoading(true);
      fetchContainers(useDemo)
        .then((res) => {
          setContainers(res);
          setContainersError(null);
          addConsoleEvent('Container', 'info', `Loaded ${res.length} containers (${useDemo ? 'Demo' : 'Live'})`);
        })
        .catch((err) => {
          setContainersError(err.message);
          setContainers([]);
        })
        .finally(() => setContainersLoading(false));

      // 3. Fetch Images
      setImagesLoading(true);
      fetchImages(useDemo)
        .then((res) => {
          setImages(res);
          setImagesError(null);
          addConsoleEvent('Docker', 'info', `Loaded ${res.length} images (${useDemo ? 'Demo' : 'Live'})`);
        })
        .catch((err) => {
          setImagesError(err.message);
          setImages([]);
        })
        .finally(() => setImagesLoading(false));
    } catch (err: any) {
      addConsoleEvent('Docker', 'error', `Failed to check status: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [isDemoMode, addConsoleEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    addConsoleEvent('Docker', 'info', `Switched environment mode to: ${nextMode ? 'Demo Sandbox' : 'Live Docker Daemon'}`);
  };

  const handleSelectContainer = async (containerId: string) => {
    try {
      const detail = await fetchContainerDetail(containerId, isDemoMode);
      setSelectedItem({ type: 'container', data: detail });
      addConsoleEvent('Container', 'info', `Inspected container: ${detail.name}`);
    } catch (err: any) {
      addConsoleEvent('Container', 'error', `Failed to inspect container: ${err.message}`);
    }
  };

  const handleSelectImage = async (imageId: string) => {
    try {
      const detail = await fetchImageDetail(imageId, isDemoMode);
      setSelectedItem({ type: 'image', data: detail });
      addConsoleEvent('Docker', 'info', `Inspected image: ${detail.tags[0] || detail.short_id}`);
    } catch (err: any) {
      addConsoleEvent('Docker', 'error', `Failed to inspect image: ${err.message}`);
    }
  };

  const handleSelectService = (service: ComposeServiceConfig) => {
    setSelectedItem({ type: 'service', data: service });
    addConsoleEvent('Compose', 'info', `Selected Compose service: ${service.name}`);
  };

  const handleContainerAction = async (
    containerId: string,
    action: 'start' | 'stop' | 'restart',
    confirm: boolean
  ) => {
    try {
      const res = await executeContainerAction(containerId, action, confirm, isDemoMode);
      if (res.success) {
        addConsoleEvent('Container', 'success', res.message);
        // Refresh containers to reflect updated state
        loadData();
      } else {
        addConsoleEvent('Container', 'warn', res.message);
      }
    } catch (err: any) {
      addConsoleEvent('Container', 'error', `Action '${action}' failed: ${err.message}`);
    }
  };

  const handleViewLogs = (containerId: string) => {
    setLogContainerId(containerId);
    setSelectedItem(null);
    setCurrentView('logs');
    addConsoleEvent('Container', 'info', `Navigated to logs for container ${containerId.slice(0, 8)}`);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedItem(null);
        }}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        dockerConnected={dockerStatus?.connected || false}
      />

      <div className="main-wrapper">
        <TopToolbar
          dockerStatus={dockerStatus}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          lastRefreshed={lastRefreshed}
        />

        {currentView === 'overview' && (
          <OverviewView
            dockerStatus={dockerStatus}
            isDemoMode={isDemoMode}
            onNavigate={(view) => setCurrentView(view)}
            onToggleDemoMode={handleToggleDemoMode}
            onRefresh={loadData}
          />
        )}

        {currentView === 'containers' && (
          <ContainersView
            containers={containers}
            isLoading={containersLoading}
            error={containersError}
            onSelectContainer={handleSelectContainer}
            onAction={handleContainerAction}
            onViewLogs={handleViewLogs}
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
          />
        )}

        {currentView === 'images' && (
          <ImagesView
            images={images}
            isLoading={imagesLoading}
            error={imagesError}
            onSelectImage={handleSelectImage}
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
          />
        )}

        {currentView === 'compose' && (
          <ComposeView
            onSelectService={handleSelectService}
            onEmitEvent={addConsoleEvent}
          />
        )}

        {currentView === 'diagnostics' && (
          <DiagnosticsView onEmitEvent={addConsoleEvent} />
        )}

        {currentView === 'logs' && (
          <LogsView
            containers={containers}
            preselectedContainerId={logContainerId}
            isDemoMode={isDemoMode}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            dockerStatus={dockerStatus}
            isDemoMode={isDemoMode}
          />
        )}

        <DiagnosticConsole
          events={consoleEvents}
          onClear={() => setConsoleEvents([])}
        />

        {/* Right Details Slide-Over */}
        <DetailsSlideOver
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          onViewLogs={handleViewLogs}
        />
      </div>
    </div>
  );
};

export default App;

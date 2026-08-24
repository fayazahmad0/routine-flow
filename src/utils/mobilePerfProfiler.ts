/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InteractionMetric {
  id: string;
  type: 'checkbox' | 'plus' | 'minus';
  taskId: string;
  tTouchDown: number;
  tHandlerStart: number;
  tStateUpdated: number;
  tRenderEnd: number;
  tPaint: number;
  totalTouchToPaintMs: number;
  handlerDurationMs: number;
  renderToPaintMs: number;
  reRenderCount: number;
  timestamp: string;
}

class MobilePerfProfiler {
  private metrics: InteractionMetric[] = [];
  private activeInteractions: Map<string, Partial<InteractionMetric>> = new Map();
  private isEnabled: boolean = false;
  private reRenderCounters: Map<string, number> = new Map();

  constructor() {
    // Enable by default in dev or when query param / local storage has ?diagnostics=true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('diagnostics') === 'true' || localStorage.getItem('rf_diagnostics') === 'true') {
        this.isEnabled = true;
      }
      (window as any).__RF_PROFILER__ = this;
    }
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rf_diagnostics', val ? 'true' : 'false');
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public startInteraction(type: 'checkbox' | 'plus' | 'minus', taskId: string, touchTime?: number): string {
    const interactionId = `${type}_${taskId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const now = performance.now();
    this.reRenderCounters.set(interactionId, 0);

    this.activeInteractions.set(interactionId, {
      id: interactionId,
      type,
      taskId,
      tTouchDown: touchTime || now,
      tHandlerStart: now,
    });

    return interactionId;
  }

  public recordStateUpdate(interactionId: string) {
    const item = this.activeInteractions.get(interactionId);
    if (item) {
      item.tStateUpdated = performance.now();
    }
  }

  public recordRender(interactionId?: string, componentName?: string) {
    if (!this.isEnabled) return;
    if (interactionId && this.reRenderCounters.has(interactionId)) {
      this.reRenderCounters.set(interactionId, (this.reRenderCounters.get(interactionId) || 0) + 1);
    }
  }

  public finishInteraction(interactionId: string, onMetricReady?: (metric: InteractionMetric) => void) {
    const item = this.activeInteractions.get(interactionId);
    if (!item) return;

    item.tRenderEnd = performance.now();

    // Measure visual paint via double RAF (standard browser paint benchmark)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const paintTime = performance.now();
        const touchDown = item.tTouchDown || item.tHandlerStart || paintTime;
        const handlerStart = item.tHandlerStart || touchDown;
        const stateUpdate = item.tStateUpdated || handlerStart;
        const renderEnd = item.tRenderEnd || stateUpdate;

        const metric: InteractionMetric = {
          id: item.id!,
          type: item.type!,
          taskId: item.taskId!,
          tTouchDown: touchDown,
          tHandlerStart: handlerStart,
          tStateUpdated: stateUpdate,
          tRenderEnd: renderEnd,
          tPaint: paintTime,
          totalTouchToPaintMs: Math.round((paintTime - touchDown) * 100) / 100,
          handlerDurationMs: Math.round((stateUpdate - handlerStart) * 100) / 100,
          renderToPaintMs: Math.round((paintTime - renderEnd) * 100) / 100,
          reRenderCount: this.reRenderCounters.get(interactionId) || 1,
          timestamp: new Date().toLocaleTimeString(),
        };

        this.metrics.unshift(metric);
        if (this.metrics.length > 30) this.metrics.pop();
        this.activeInteractions.delete(interactionId);
        this.reRenderCounters.delete(interactionId);

        if (this.isEnabled) {
          console.log(
            `%c[MOBILE-PERF] ${metric.type.toUpperCase()} | Total Touch->Paint: ${metric.totalTouchToPaintMs}ms | Handler: ${metric.handlerDurationMs}ms | Paint: ${metric.renderToPaintMs}ms`,
            metric.totalTouchToPaintMs < 25 ? 'color: #10b981; font-weight: bold;' : 'color: #f59e0b; font-weight: bold;',
            metric
          );
        }

        if (onMetricReady) onMetricReady(metric);
      });
    });
  }

  public getMetrics(): InteractionMetric[] {
    return [...this.metrics];
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

export const mobilePerfProfiler = new MobilePerfProfiler();

// Type declarations for BPMN-related libraries without official TypeScript definitions

declare module 'diagram-js-minimap' {
  const MinimapModule: any;
  export default MinimapModule;
}

declare module 'diagram-js-grid' {
  const GridModule: any;
  export default GridModule;
}

declare module 'bpmn-js/lib/Modeler' {
  class Modeler {
    constructor(options?: any);
    get(name: string): any;
    importXML(xml: string): Promise<{ warnings: string[] }>;
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
    saveSVG(): Promise<{ svg: string }>;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    attachTo(container: HTMLElement): void;
    detach(): void;
  }
  export default Modeler;
}

declare module 'bpmn-js/lib/Viewer' {
  class Viewer {
    constructor(options?: any);
    get(name: string): any;
    importXML(xml: string): Promise<{ warnings: string[] }>;
    saveSVG(): Promise<{ svg: string }>;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
  }
  export default Viewer;
}

declare module 'bpmn-js-properties-panel' {
  export const BpmnPropertiesPanelModule: any;
  export const BpmnPropertiesProviderModule: any;
  export function useService(name: string): any;
}

declare module '@bpmn-io/properties-panel' {
  export function useService(name: string): any;
  export const PropertiesPanelModule: any;
}

declare module 'camunda-bpmn-moddle/resources/camunda' {
  const camundaModdle: any;
  export default camundaModdle;
}

declare module 'camunda-bpmn-moddle' {
  const camundaModdle: any;
  export default camundaModdle;
}

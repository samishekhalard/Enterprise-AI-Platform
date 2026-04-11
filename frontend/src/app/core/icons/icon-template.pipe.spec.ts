import { TestBed } from '@angular/core/testing';
import { IconNamePipe } from './icon-template.pipe';

describe('IconNamePipe', () => {
  let pipe: IconNamePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IconNamePipe],
    });
    pipe = TestBed.inject(IconNamePipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform legacy PrimeIcon names to Phosphor names', () => {
    expect(pipe.transform('box')).toBe('phosphorCubeThin');
    expect(pipe.transform('home')).toBe('phosphorHouseThin');
  });

  it('should pass through Phosphor names unchanged', () => {
    expect(pipe.transform('phosphorCubeThin')).toBe('phosphorCubeThin');
  });

  it('should pass through BPMN names unchanged', () => {
    expect(pipe.transform('bpmnTask')).toBe('bpmnTask');
  });
});

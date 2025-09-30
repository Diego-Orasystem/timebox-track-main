import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeboxFrappeGanttComponent } from './timebox-frappe-gantt.component';

describe('TimeboxFrappeGanttComponent', () => {
  let component: TimeboxFrappeGanttComponent;
  let fixture: ComponentFixture<TimeboxFrappeGanttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeboxFrappeGanttComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeboxFrappeGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

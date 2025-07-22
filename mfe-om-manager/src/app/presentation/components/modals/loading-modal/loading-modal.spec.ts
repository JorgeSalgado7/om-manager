import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingModal } from './loading-modal';

describe('LoadingModal', () => {
  let component: LoadingModal;
  let fixture: ComponentFixture<LoadingModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

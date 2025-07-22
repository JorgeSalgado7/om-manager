import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateOrganization } from './update-organization';

describe('UpdateOrganization', () => {
  let component: UpdateOrganization;
  let fixture: ComponentFixture<UpdateOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

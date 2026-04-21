import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ReceivePaymentDialog, ReceivePaymentDialogData } from './receive-payment-dialog';
import { PaymentMethodService } from '../../services/payment-method.service';

const TEST_DATA: ReceivePaymentDialogData = {
  orderId: 'order-1',
  orderCode: 42,
  orderTotal: 200,
  remainingBalance: 100,
};

describe('ReceivePaymentDialog', () => {
  let component: ReceivePaymentDialog;
  let fixture: ComponentFixture<ReceivePaymentDialog>;
  let dialogClose: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    dialogClose = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ReceivePaymentDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: TEST_DATA },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: PaymentMethodService, useValue: { getAll: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivePaymentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('row add/remove', () => {
    it('starts with one row pre-filled to the remaining balance', () => {
      expect(component.payments().length).toBe(1);
      expect(component.payments()[0].amount).toBe(TEST_DATA.remainingBalance);
    });

    it('addPayment appends an empty row', () => {
      component.addPayment();
      expect(component.payments().length).toBe(2);
      expect(component.payments()[1].amount).toBe(0);
    });

    it('removePayment removes the row at the given index', () => {
      component.addPayment(); // two rows
      component.removePayment(0);
      expect(component.payments().length).toBe(1);
    });
  });

  describe('running total', () => {
    it('totalPaid sums all row amounts', () => {
      component.payments.set([
        { methodId: 'pm-1', amount: 60 },
        { methodId: 'pm-2', amount: 25 },
      ]);
      expect(component.totalPaid()).toBe(85);
    });

    it('remainingTotal is remainingBalance minus totalPaid', () => {
      component.payments.set([{ methodId: 'pm-1', amount: 40 }]);
      expect(component.remainingTotal()).toBe(TEST_DATA.remainingBalance - 40);
    });
  });

  describe('submit blocking', () => {
    it('isValid returns false when a row has no method selected', () => {
      component.payments.set([{ methodId: '', amount: 100 }]);
      expect(component.isValid()).toBe(false);
    });

    it('isValid returns false when batch total exceeds remaining balance', () => {
      component.payments.set([{ methodId: 'pm-1', amount: TEST_DATA.remainingBalance + 1 }]);
      expect(component.isValid()).toBe(false);
    });

    it('isValid returns true for a valid batch within the remaining balance', () => {
      component.payments.set([{ methodId: 'pm-1', amount: TEST_DATA.remainingBalance }]);
      expect(component.isValid()).toBe(true);
    });

    it('confirm does not close the dialog when the batch is invalid', () => {
      component.payments.set([{ methodId: '', amount: 0 }]);
      component.confirm();
      expect(dialogClose).not.toHaveBeenCalled();
    });

    it('confirm closes with mapped payment rows when the batch is valid', () => {
      component.payments.set([{ methodId: 'pm-1', amount: 100 }]);
      component.confirm();
      expect(dialogClose).toHaveBeenCalledWith({
        payments: [{ paymentMethodId: 'pm-1', amount: 100 }],
      });
    });
  });
});

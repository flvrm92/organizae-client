import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private _loading = new Subject<boolean>();
  public readonly loading$ = this._loading.asObservable();

  constructor(private snackBarService: MatSnackBar) { }

  showProgressBar(loading: boolean): void {
    this._loading.next(loading);
  }

  displayMessage(message: string, dismissText: string = 'Ok', durationSeconds: number = 4, position: 'top' | 'bottom' = 'bottom') {
    this.snackBarService.open(message, dismissText, {
      duration: durationSeconds * 1000,
      verticalPosition: position
    });
  }
}
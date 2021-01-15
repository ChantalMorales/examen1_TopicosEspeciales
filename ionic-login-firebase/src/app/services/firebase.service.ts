// firebase.service.ts
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable( {
  providedIn: 'root'
} )
export class FirebaseService {


  constructor(
    private database: AngularFireDatabase
  ) { }

  sendMessage( record ) {
    return this.database.list( '/messages/' ).push( record );
  }

  allMessages() {
    return this.database.database.ref( '/messages' );
  }

}

// dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { ActionSheetController, NavController } from '@ionic/angular';
import { AuthenticateService } from '../services/authentication.service';
import { FirebaseService } from '../services/firebase.service';
import { CameraOptions, Camera } from '@ionic-native/camera/ngx';
import firebase from 'firebase/app';
import * as CryptoJS from 'crypto-js';

@Component( {
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: [ './dashboard.page.scss' ],
} )
export class DashboardPage implements OnInit {

  userEmail: string;
  chats: any = [];
  message: any;
  uid: any;
  tmpImage: any = undefined;
  random = Math.floor( Math.random() * 500 );
  encryptedMessage = '';
  decryptedMessage = '';


  constructor(
    private navCtrl: NavController,
    private authService: AuthenticateService,
    private firebaseP: FirebaseService,
    private actionSheetController: ActionSheetController,
    private camera: Camera,
  ) { }

  ngOnInit() {

    this.authService.userDetails().subscribe( res => {
      if( res !== null ) {
        this.userEmail = res.email;
        this.uid = res.uid;
      } else {
        this.navCtrl.navigateBack( '' );
      }
    }, err => {
      console.log( 'err', err );
    } );
    this.firebaseP.allMessages().on( 'value', ( dataSnap ) => {
      this.chats = [];
      dataSnap.forEach( ( data ) => {
        if( data.val().message ) {
          this.decryption( data.val().message );
          this.chats.push( {
            uid: data.val().uid,
            email: data.val().email,
            message: this.decryptedMessage,
          } );
        } else {
          this.decryption( data.val().image );
          this.chats.push( {
            uid: data.val().uid,
            email: data.val().email,
            image: this.decryptedMessage,
          } );
        }

      } );
    } );

  }

  encryption( text ) {
    this.encryptedMessage = CryptoJS.AES.encrypt( text, 'secret key 123', 'secret key 123' ).toString();
  }

  decryption( text ) {
    this.decryptedMessage = CryptoJS.AES.decrypt( text, 'secret key 123', 'secret key 123' ).toString( CryptoJS.enc.Utf8 );
  }

  async sendMessage() {
    let messageSent = {};
    this.encryption(this.message);
    if( this.tmpImage !== undefined ) {
      messageSent = {
        uid: this.uid,
        image: this.encryptedMessage,
        email: this.userEmail
      };
    } else {
      messageSent = {
        uid: this.uid,
        message: this.encryptedMessage,
        email: this.userEmail
      };
    }


    try {
      await this.firebaseP.sendMessage( messageSent );
    } catch( e ) {
      console.log( 'error', e );
    }

  }

  takePhoto( sourceType ) {
    try {
      const options: CameraOptions = {
        quality: 50,
        targetHeight: 600,
        targetWidth: 600,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        correctOrientation: true,
        sourceType
      };

      this.camera.getPicture( options )
        .then( async( imageData ) => {
          console.log( 'IMAGE DATA', imageData );
          this.tmpImage = 'data:image/jpeg;base64,' + imageData;
          const pictures = firebase.storage().ref( 'images/' + this.random + '.jpeg' );
          pictures.putString( this.tmpImage, 'data_url' ).then( ( snapshot ) => {
            console.log( 'snapshot', snapshot.ref );
          } );
          const getPicture = firebase.storage().ref( 'images/' + this.random + '.jpeg' ).getDownloadURL();
          getPicture.then( ( url ) => {
            this.message = url;
          } );
        } )
        .catch( ( e ) => {
          console.log( e );
          this.tmpImage = undefined;
        } );
    } catch( e ) {
      console.log( e );
      this.tmpImage = undefined;
    }
  }

  async presentActionSheetCamera() {
    const actionSheet = await this.actionSheetController.create( {
      buttons: [
        {
          text: 'Cámara',
          handler: () => {
            this.takePhoto( this.camera.PictureSourceType.CAMERA );
          }
        }, {
          text: 'Ver imágenes guardadas',
          handler: () => {
            this.takePhoto( this.camera.PictureSourceType.PHOTOLIBRARY );
          }
        }, {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    } );
    await actionSheet.present();
  }

  logout() {
    this.authService.logoutUser()
      .then( res => {
        console.log( res );
        this.navCtrl.navigateBack( '' );
      } )
      .catch( error => {
        console.log( error );
      } );
  }
}

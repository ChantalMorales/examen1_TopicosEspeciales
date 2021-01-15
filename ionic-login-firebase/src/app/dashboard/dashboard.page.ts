// dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { ActionSheetController, NavController } from '@ionic/angular';
import { AuthenticateService } from '../services/authentication.service';
import { FirebaseService } from '../services/firebase.service';
import { CameraOptions, Camera } from '@ionic-native/camera/ngx';
import firebase from 'firebase/app';

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
  random = Math.floor(Math.random() * 500);


  constructor(
    private navCtrl: NavController,
    private authService: AuthenticateService,
    private firebaseP: FirebaseService,
    private actionSheetController: ActionSheetController,
    private camera: Camera,
  ) { }

  ngOnInit() {

    this.authService.userDetails().subscribe( res => {
      console.log( 'res', res );
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
        this.chats.push( { ...data.val() } );
      } );
    } );

  }

  async sendMessage() {
    let messageSent = {};
    if( this.tmpImage !== undefined ) {
      messageSent = {
        uid: this.uid,
        image: this.message,
        email: this.userEmail
      };
    } else {
      messageSent = {
        uid: this.uid,
        message: this.message,
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

import QRReader from './vendor/qrscan.js';
import { snackbar } from './snackbar.js';
import styles from '../css/styles.css';
import isURL from 'is-url';
import image from '../images/logo-stq.png';

//If service worker is installed, show offline usage notification
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        console.log('SW registered: ', reg);
        if (!localStorage.getItem('offline')) {
          localStorage.setItem('offline', true);
          snackbar.show('App is ready for offline usage.', 5000);
        }
      })
      .catch(regError => {
        console.log('SW registration failed: ', regError);
      });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  //To check the device and add iOS support
  window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
  window.isMediaStreamAPISupported = navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
  window.noCameraPermission = false;

  var config = require('../config.json');

  var popupTimeout = config['timeout'] * 1000; // secondes in millis
  var popupInfo = config['afficher_infos_client'];

  var copiedText = null;
  var frame = null;
  var selectPhotoBtn = document.querySelector('.app__select-photos');
  var dialogElement = document.querySelector('.app__dialog');
  var dialogOverlayElement = document.querySelector('.app__dialog-overlay');
  // var dialogOpenBtnElement = document.querySelector('.app__dialog-open');
  // var dialogCloseBtnElement = document.querySelector('.app__dialog-close');
  var scanningEle = document.querySelector('.custom-scanner');
  var resultEle = document.querySelector('.app__dialog-table');
  // var textBoxEle = document.querySelector('#result');
  var helpTextEle = document.querySelector('.app__help-text');
  var infoSvg = document.querySelector('.app__header-icon svg');
  var videoElement = document.querySelector('video');
  window.appOverlay = document.querySelector('.app__overlay');

  //Initializing qr scanner
  window.addEventListener('load', event => {
    QRReader.init(); //To initialize QR Scanner
    // Set camera overlay size
    setTimeout(() => {
      setCameraOverlay();
      if (window.isMediaStreamAPISupported) {
        scan();
      }
    }, 1000);

    // To support other browsers who dont have mediaStreamAPI
    selectFromPhoto();
  });

  function setCameraOverlay() {
    window.appOverlay.style.borderStyle = 'solid';
  }

  function createFrame() {
    frame = document.createElement('img');
    frame.src = '';
    frame.id = 'frame';
  }

  //Dialog close btn event
  //dialogCloseBtnElement.addEventListener('click', hideDialog, false);
  //dialogOpenBtnElement.addEventListener('click', openInBrowser, false);

  //To open result in browser
  function openInBrowser() {
    console.log('Result: ', copiedText);
    window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
    copiedText = null;
    hideDialog();
  }

  //Scan
  function scan(forSelectedPhotos = false) {
    if (window.isMediaStreamAPISupported && !window.noCameraPermission) {
      scanningEle.style.display = 'block';
    }

    if (forSelectedPhotos) {
      scanningEle.style.display = 'block';
    }

    QRReader.scan(result => {
      copiedText = result;
      scanningEle.style.display = 'none';
      var xhttp = new XMLHttpRequest();
      xhttp.open('GET', 'https://billetterie.real-it.duckdns.org/requete-qr?qr=' + result, true);
      xhttp.send();
      xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
          var logo = "<img id='logo-stq' src='/images/logo-stq-640.png' width='80%' height='80%'>";
          if (this.responseText.length <= 2) {
            resultEle.innerHTML =
              logo + "<div class='alert alert-danger'>" + '<strong>Erreur : Billet invalide </strong> Veuillez réessayer' + '</div>';
          } else {
            var aAfficher = logo;
            var alert = "<div class='alert alert-success'>" + '<strong>Billet valide</strong> Vous pouvez avancer</div>';
            if (popupInfo) {
              var commande = JSON.parse(this.responseText);
              aAfficher += '<div>' + commande.passagers.length + ' passagers : ' + '</div>';
              commande.passagers.forEach(function(passager) {
                aAfficher += '<div>' + passager.nom + ' ' + passager.prenom + '</div>';
              });
              aAfficher += alert;
              resultEle.innerHTML = aAfficher;
            } else {
              resultEle.innerHTML = aAfficher;
            }
          }
          console.log(this.responseText);
        }
      };

      setTimeout(function() {
        hideDialog();
      }, popupTimeout);

      dialogElement.classList.remove('app__dialog--hide');
      dialogOverlayElement.classList.remove('app__dialog--hide');
      const frame = document.querySelector('#frame');
      // if (forSelectedPhotos && frame) frame.remove();
    }, forSelectedPhotos);
  }

  //Hide dialog
  function hideDialog() {
    copiedText = null;
    // textBoxEle.value = '';
    resultEle.innerHTML = '';

    if (!window.isMediaStreamAPISupported) {
      frame.src = '';
      frame.className = '';
    }

    dialogElement.classList.add('app__dialog--hide');
    dialogOverlayElement.classList.add('app__dialog--hide');
    scan(); // Ce scan pose un problème quand on lit des images locales ==> double popup
  }

  function selectFromPhoto() {
    //Creating the camera element
    var camera = document.createElement('input');
    camera.setAttribute('type', 'file');
    camera.setAttribute('capture', 'camera');
    camera.id = 'camera';
    window.appOverlay.style.borderStyle = '';
    selectPhotoBtn.style.display = 'block';
    createFrame();

    //Add the camera and img element to DOM
    var pageContentElement = document.querySelector('.app__layout-content');
    pageContentElement.appendChild(camera);
    pageContentElement.appendChild(frame);

    //Click of camera fab icon
    selectPhotoBtn.addEventListener('click', () => {
      scanningEle.style.display = 'none';
      document.querySelector('#camera').click();
    });

    //On camera change
    camera.addEventListener('change', event => {
      if (event.target && event.target.files.length > 0) {
        frame.className = 'app__overlay';
        frame.src = URL.createObjectURL(event.target.files[0]);
        if (!window.noCameraPermission) scanningEle.style.display = 'block';
        window.appOverlay.style.borderColor = 'rgb(62, 78, 184)';
        scan(true);
      }
    });
  }
});

import * as THREE from "./threejs/build/three.module.js";
import { OrbitControls } from "./threejs/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./threejs/jsm/loaders/GLTFLoader.js";
import { RoughnessMipmapper } from "./threejs/jsm/utils/RoughnessMipmapper.js";
import { GUI } from "./threejs/jsm/libs/dat.gui.module.js";
// import { OrbitControlsGizmo } from "./threejs/jsm/controls/OrbitControlsGizmo.js";


// Global Variables 🌎
let renderer,
  scene,
  camera,
  controls,
  directLight,
  model,
  modal=true,
  raycaster,
  pointer,
  rotatableModel,
  draggableModel,
  scalableModel,
  logStack=[],
  stackModels=[],
  aspectRatio = window.innerHeight / window.innerWidth;

// Initialize scene
const init = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222831);
  // scene.fog = new THREE.FogExp2(0xcccccc, 0.22);
  
  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.querySelector("#app").appendChild(renderer.domElement);
  

// CAMERA MOVEMENT CONTROLS
  camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0, 2000 );

  // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 1, window.innerHeight);
  controls.enableDamping = true;
  controls.update();
  controls.enabled = false;

  // LIGHTS
  directLight = new THREE.DirectionalLight(0xffffff);
  directLight.position.set(1, 1, 1);
  scene.add(directLight);

 // RAYCASTING (mouse functionality)
 raycaster = new THREE.Raycaster();
 pointer = new THREE.Vector2();


};

// get Background

const uploadBackground = document.querySelector("#uploadBackground")
const getBackground = document.querySelector("#getBackground");
uploadBackground.onclick = (e) => {
  if (getBackground) {
    getBackground.click();
    getBackground.onchange = (e) => {
      changeBackground();
      console.log("Background Changed !")
  }
  }else
  console.log("Have a problem in change background !!")
}


// change Background

const changeBackground = () =>{
  let file = document.querySelector("#getBackground").files[0];
  let reader = new FileReader();
  reader.onloadend = function () {
    let bgTexture = new THREE.TextureLoader().load(reader.result);
    let floor = new THREE.Mesh(
      new THREE.BoxBufferGeometry(window.innerWidth,window.innerHeight,0),
      new THREE.MeshPhongMaterial({ map: bgTexture, transparent: false })
     );
    floor.position.set(0, 0,0);
    floor.rotation.set(Math.PI / 1, 0, -Math.PI);
    floor.isDraggable = false;
    scene.add(floor);
 
  };
  if (file) {
    reader.readAsDataURL(file);
  } else {
  }
}



// choose Models
const test = document.querySelector("#insert-test");
test.onclick = (e) => {
  insertModel("heliamid.glb");
  console.log("Clicked to add Model !")
};


// Insert Models
const insertModel= (modelName) =>{
  const roughnessMipmapper = new RoughnessMipmapper(renderer);
  const loader = new GLTFLoader().setPath(`../assets/models/`);
  loader.load(modelName, function (gltf) {
    model = gltf.scene;
    model.position.set(0, 0, 5);
    model.scale.set(10, 10, 10);
    model.name = modelName;
    model.traverse(function (child) {
      if (child.material) child.material.metalness = 0;
      {
        if (child.isMesh) {
          roughnessMipmapper.generateMipmaps(child.material);
        }
      }
      
    });
    model.isDraggable = true;
    model.isRotatable = true;
    scene.add(model);
    stackModels.push(model);
    roughnessMipmapper.dispose();
    console.log("Inserting  model Done !");
    document.querySelector("#preloader").classList.add("hidden");
  },
 
	// called while loading is progressing
   ( xhr ) => {
    document.querySelector("#preloader").classList.remove("hidden"),
    document.querySelector("#percentage").innerText =
    Math.round((xhr.loaded / xhr.total) * 100) + "%";
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
	// called when loading has errors
	 ( error ) => {
	console.log( 'An error happened' );

	},
  
)
;
}



// Control Model (Drag & Rotate)

const dragModel=() =>{
  // If 'holding' an model, move the model
  if (draggableModel) {
    raycaster.setFromCamera(pointer, camera);
    const found = raycaster.intersectObjects(scene.children);
    if (found.length > 0) {
      for (const obj3d of found) {
        if (!obj3d.object.isDraggable) {
          draggableModel.position.y = obj3d.point.y;
          draggableModel.position.x = obj3d.point.x;
          break;
        }
      }
    }
  }
}





const rotateModel=()=> {
  // If 'holding' an model, Rotate the model
  if (rotatableModel) {
    raycaster.setFromCamera(pointer, camera);
    const foundR = raycaster.intersectObjects(scene.children);
    if (foundR.length > 0) {
      for (const obj3dR of foundR) {
        if (!obj3dR.object.isRotatable) {
          rotatableModel.rotation.z = 
            obj3dR.point.y/200 ;
          rotatableModel.rotation.y = 
            obj3dR.point.x /200;
          break;
        }
      }
    }
  }
}

window.addEventListener("dblclick", (event) => {
  if (draggableModel || rotatableModel) {
    draggableModel = undefined;
    rotatableModel = undefined;
    return;
  }
  
  raycaster.setFromCamera(pointer, camera);
  const found = raycaster.intersectObjects(scene.children, true);
  if (found.length) {
       let current = found[0].object;
    while (current.parent.parent !== null) {
      current = current.parent;
      console.log(current.parent);
    }
    if (current.isDraggable) {
      draggableModel = current;
    }
  }
});

window.addEventListener("contextmenu", (event) => {
  if (rotatableModel) {
    rotatableModel = undefined;
    return;
  }
  raycaster.setFromCamera(pointer, camera);
  const foundR = raycaster.intersectObjects(scene.children, true);
  if (foundR.length) {

    let currentR = foundR[0].object;
    while (currentR.parent.parent !== null) {
      currentR = currentR.parent;
    }
    if (currentR.isRotatable) {
      rotatableModel = currentR;
    }
  }
});
// Hide right click context menus
window.addEventListener("contextmenu", (e) => e.preventDefault());





window.addEventListener("touchstart", (event) => {
  if (draggableModel || rotatableModel) {
    draggableModel = undefined;
    rotatableModel = undefined;
    return;
  }
   raycaster.setFromCamera(pointer, camera);
  const found = raycaster.intersectObjects(scene.children, true);
  if (found.length) {
    let current = found[0].object;
    while (current.parent.parent !== null) {
      current = current.parent;
    }
    if (current.isDraggable) {
      draggableModel = current;
    }
  }
});


window.addEventListener("wheel", (event) => {
  model.scale.x += event.deltaY * -0.01;
  model.scale.y += event.deltaY * -0.01;
  model.scale.z += event.deltaY * -0.01;
});


// removeLast & clearAll models

const undo = document.querySelector("#undo");
undo.onclick = (e) => {
  removeModel();
  console.log("Remove last model!")
};

const removeModel = () => {
  scene.remove(stackModels[stackModels.length - 1]);
    stackModels.pop(model);
}

const clear = document.querySelector("#clear");
clear.onclick = (e) => {
  cleanScene();
  console.log("Clear scene!")
};

const cleanScene=() =>{
  while (stackModels.length > 0) {
    scene.remove(stackModels[stackModels.length - 1]);
    stackModels.pop(model);
  }
}

// screen capture
const captureScreen = document.querySelector("#captureScreen");
captureScreen.onclick = (e) => {
  getCaptureScreen();
  console.log("Captured!")
};
const getCaptureScreen= () =>{
  let now =Date.now();
  let a = document.createElement("a");
  a.download = `3D-Lighting-Capture(${now}).png`;
  renderer.render(scene, camera);
  a.href = renderer.domElement.toDataURL();
  a.click();
};
// Control & change Modal

const modalToggleClose = document.querySelector("#modalToggleClose");
const modalToggleOpen= document.querySelector("#modalToggleOpen");

modalToggleClose.onclick = (e) => {
  document.querySelector("#modalToggleClose").classList.add("hidden");
  document.querySelector("#modalToggleOpen").classList.add("show");
  document.querySelector("#modal").classList.add("close")
  document.querySelector("#content").classList.add("hidden")
  document.querySelector("#title").classList.add("hidden")
  document.querySelector("#horizontalLine").classList.add("hidden")
  modal =false;
};
modalToggleOpen.onclick = (e) => {
  document.querySelector("#modalToggleClose").classList.remove("hidden");
  document.querySelector("#modalToggleOpen").classList.remove("show");
  document.querySelector("#modal").classList.remove("close")
  document.querySelector("#content").classList.remove("hidden")
  document.querySelector("#title").classList.remove("hidden")
  document.querySelector("#horizontalLine").classList.remove("hidden")
  modal =true;
  document.querySelector("#lightSettingAside").classList.add("hidden");
};

const lightRange= document.querySelector("#lightRange");
lightRange.onchange = (e) => {
  directLight.position.x=lightRange.value;
  console.log(directLight.position.y);
}

const lightSetting= document.querySelector("#lightSetting");
lightSetting.onclick = (e) => {
  if (document.querySelector("#lightSettingAside").classList.contains("hidden")){
    modalToggleClose.click(); 
    document.querySelector("#lightSettingAside").classList.add("show");
    document.querySelector("#lightSettingAside").classList.remove("hidden");
  } else {
  document.querySelector("#lightSettingAside").classList.add("hidden");
    document.querySelector("#lightSettingAside").classList.remove("show");
  }
}


const help= document.querySelector("#help");
help.onclick = (e) => {
  if (modal){
    modalToggleClose.click();
  } else {
  modalToggleOpen.click();
}
}


  setTimeout(() => {
    modalToggleClose.click();
    console.log("show welcome modal for 3 second.");
  }, "3000")



  window.addEventListener("mousemove", (event) => {
    dragModel(); // Updates the model's position anytime the mouse moves
    rotateModel();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });  

// Control & change resize Window
const onWindowResize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

// Initialize animation 🎞️
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
 
};

// Run 💡
( ()=> {
  init();
  animate();
  window.addEventListener("resize", onWindowResize, true);
})();
document.querySelector("#preloader").classList.add("hidden");



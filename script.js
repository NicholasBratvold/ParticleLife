import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, particles, controls, mouse;

const n = 2000;
const dt = 0.0001;
const frictionHL = 0.040;
const rMax = 0.3;
const m = 6;
const attractions = makeRandomAttractionMatrix();
const forceFactor = 10;
const frictionFactor = Math.pow(0.5, dt/frictionHL);
const cameraDepth = 50
//Particle Initialization
const colours = new Int32Array(n);




function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, cameraDepth );
    camera.position.z = 0.5;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.setClearColor( 0x080808, 1 );
    document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = true;

    // Create a BufferGeometry
    var geometry = new THREE.BufferGeometry();

    // Create position attribute (initially empty)
    var positions = new Float32Array(n * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Create color attribute (initially empty)
    var colors = new Float32Array(n * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
     // Create velocity attribute
    var velocities = new Float32Array(n * 3);
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

   
    // Create a material
    var material = new THREE.PointsMaterial({ 
        vertexColors: THREE.VertexColors, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        size: 0.002
    });

    // Create a particle system
    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    for(let i=0; i< n; i++){
        colours[i] = Math.floor(Math.random()*m);
    }

    var colors = particles.geometry.attributes.color.array;
    var positions = particles.geometry.attributes.position.array;
    var velocities = particles.geometry.attributes.velocity.array;
    for(let i=0; i< n; i++){
        var index = i*3;

        var hue = (colours[i]/m) * 360; // Use the particle index to determine the hue
        var saturation = 0.5; // 100% saturation
        var lightness = 0.5; // 50% lightness
        var rgbColor = new THREE.Color().setHSL(hue / 360, saturation, lightness);
        
        colors[index] = rgbColor.r;
        colors[index + 1] = rgbColor.g;
        colors[index + 2] = rgbColor.b;

        velocities[index] = 0.0;
        velocities[index+1] = 0.0;
        velocities[index+2] = 0.0;

        positions[index] = (Math.random() - 0.5) * 1; // Example: Random movement along the x-axis
        positions[index + 1] = (Math.random() - 0.5) * 1; // Example: Random movement along the y-axis
        positions[index + 2] = (Math.random() - 0.5) * 1; // Example: Random movement along the z-axis
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.velocity.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;

}

// 

function loop(){
    //Update
    updateParticles();
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
    //particles.geometry.attributes.velocity.needsUpdate = true;

    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );

}

function updateParticles(){

    var positions = particles.geometry.attributes.position.array;
    var velocites = particles.geometry.attributes.position.array; //This is a mistake but it just looks better
    var i, j, index, jndex, dx, dy, dz, r , accX, accY, accZ, a;
    const offset = 0.05;

    for(i=0; i< n; i++){
        index = i * 3;
        accX = 0;
        accY = 0;
        accZ = 0;

        for(j=0; j < n; j++){
            jndex = j * 3;
            if (j==i) continue;
            dx = positions[jndex] - positions[index];
            dy = positions[jndex+1] - positions[index+1];
            dz = positions[jndex+2] - positions[index+2];
            r = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if( r > 0 && r<rMax){
                a = acceleration(r / rMax, attractions[colours[i]][colours[j]]);
                accX += dx / r * a;
                accY += dy / r * a;
                accZ += dz / r * a;
            }
        }
        accX *= rMax * forceFactor;
        accY *= rMax * forceFactor;
        accZ *= rMax * forceFactor;

        velocites[index] *= frictionFactor;
        velocites[index+1] *= frictionFactor;
        velocites[index+2] *= frictionFactor;
        velocites[index] += accX * dt;
        velocites[index+1] += accY * dt;
        velocites[index+2] += accZ * dt;     
    }

    for (i = 0; i< n; i++){
        index = i*3; 
        positions[index] += velocites[index]* dt;
        positions[index+1] += velocites[index+1]* dt;
        positions[index+2] += velocites[index+2]* dt;

        if (positions[index] < -1 - offset) {
            positions[i] += 2 + 2*offset;
        } else if (positions[index] > 2 + offset) {
            positions[index] -= (2 + 2*offset);
        }

        if (positions[index+1] < -1 - offset) {
            positions[index+1] += 2 + 2*offset;
        } else if (positions[index+1] > 2 + offset) {
            positions[index+1] -= (2 + 2*offset);
        }

        if (positions[index+2] < -1 - offset) {
            positions[index+2] += 2 + 2*offset;
        } else if (positions[index+2] > 2 + offset) {
            positions[index+2] -= (2 + 2*offset);
        }

    }
}

function acceleration(r, a){
    const beta = 0.2;
    if(r< beta){
        return r / beta -1;
    } else if( beta < r && r < 1){
        return a * (1 - Math.abs(2 * r - 1 - beta)/(1 - beta));
    } else {
        return 0;
    }
}

// Produces Random Attraction Matrix for m particle types
function makeRandomAttractionMatrix(){
    const matrix = [];
    for (let i=0; i< m; i++){
        const row = [];
        for (let j = 0; j< m; j++){
            // if (i==j){
            //     row.push(-1);
            // } else{
            //     row.push(Math.random()*2-1);
            // }
            row.push(Math.random() * 2 - 1);
        }
        matrix.push(row);
    }
    return matrix;   
}


init();
loop();


// // Define grid parameters
// const gridSize = 200;
// const gridWidth = Math.ceil(window.innerWidth / gridSize);
// const gridHeight = Math.ceil(window.innerHeight / gridSize);
// const gridDepth = Math.ceil(cameraDepth / gridSize);
// const grid = new Array(gridWidth * gridHeight * gridDepth);

// function clearGrid() {
//     for (let i = 0; i < grid.length; i++) {
//         grid[i] = [];
//     }
// }

// function updateGrid() {
//     clearGrid();
//     var positions = particles.geometry.attributes.position.array;
//     // Update particle positions in the grid
//     for (let i = 0; i < n; i++) {
//         let id = i * 3;
//         const gridX = Math.floor(positions[id] * window.innerWidth / gridSize);
//         const gridY = Math.floor(positions[id+1] * window.innerHeight / gridSize);
//         const gridZ = Math.floor(positions[id+2] * cameraDepth / gridSize);

//         if (!grid[gridZ]) {
//             grid[gridZ] = [];
//         }

//         if (!grid[gridZ][gridY]) {
//             grid[gridZ][gridY] = [];
//         }

//         if (!grid[gridZ][gridY][gridX]) {
//             grid[gridZ][gridY][gridX] = [];
//         }

//         grid[gridZ][gridY][gridX].push(i);
//     }
// }

//function findNeighbors(particleIndex) {
    //     const neighbors = [];
    //     var positions = particles.geometry.attributes.position.array;
    //     const gridX = Math.floor(positions[particleIndex] * window.innerWidth / gridSize);
    //     const gridY = Math.floor(positions[particleIndex+1] * window.innerHeight / gridSize);
    //     const gridZ = Math.floor(positions[particleIndex+2] * cameraDepth / gridSize);
    
    //     for (let dx = -1; dx <= 1; dx++) {
    //         for (let dy = -1; dy <= 1; dy++) {
    //             for (let dz = -1; dz <= 1; dz++) {
    //                 const neighborX = (gridX + dx + gridWidth) % gridWidth;
    //                 const neighborY = (gridY + dy + gridHeight) % gridHeight;
    //                 const neighborZ = (gridZ + dz + gridDepth) % gridDepth;
    
    //                 if (grid[neighborZ] && grid[neighborZ][neighborY] && grid[neighborZ][neighborY][neighborX]) {
    //                     neighbors.push(...grid[neighborZ][neighborY][neighborX]);
    //                 }
    //             }
    //         }
    //     }
    
    //     return neighbors;
    // }
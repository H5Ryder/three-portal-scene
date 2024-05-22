import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { texture } from 'three/examples/jsm/nodes/Nodes.js'
import fireFliesVertexShader from './shaders/fireFlies/vertex.glsl'
import fireFliesFragmentShader from './shaders/fireFlies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}

const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)


/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.colorSpace = THREE.SRGBColorSpace
bakedTexture.flipY = false

/**
 * Materials
 */

// Baked Material
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture })

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({color: 0xffffe5})

// Portal light material

debugObject.portalColorStart = '#1cf000'
debugObject.portalColorEnd = '#ff33be'

gui
    .addColor(debugObject, 'portalColorStart')
    .onChange(() => 
    {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
    })


    gui
    .addColor(debugObject, 'portalColorEnd')
    .onChange(() => 
    {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
    })

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color('#1cf000')},
        uColorEnd: {value: new THREE.Color('#ff33be')}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
 })





/**
 * Model
 */
gltfLoader.load(
    'portal.glb',
    (gltf) => {
        
        gltf.scene.traverse((child) => {
            child.material = bakedMaterial
        })

        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'PoleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'PoleLightB')
        const portaLightMesh  = gltf.scene.children.find(child => child.name === 'PortalLight')


        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portaLightMesh.material = portalLightMaterial

        gltf.scene.rotation.y += -3;

        scene.add(gltf.scene)
    }
)



/**
 * Fireflies
 */
const fireFliesGeometry = new THREE.BufferGeometry()
const fireFliesCount = 30
const positionArray = new Float32Array(fireFliesCount * 3)
const scaleArray = new Float32Array(fireFliesCount)

for (let i = 0; i < fireFliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 4
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

fireFliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray,3))
fireFliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray,1))

// Material
const fireFliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0},
        uPixelRatio: {value: Math.min(window.devicePixelRatio,2)},
        uSize: { value: 100},
    },
    vertexShader: fireFliesVertexShader,
    fragmentShader: fireFliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(fireFliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('fireFliersSize')

// Points
const fireFlies = new THREE.Points(fireFliesGeometry, fireFliesMaterial)
scene.add(fireFlies)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireFlies
    fireFliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio,2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


debugObject.clearColor = '#201919'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor')
.onChange(() => {
    renderer.setClearColor(debugObject.clearColor)

})


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    fireFliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { deleteDoc, getDocs } from 'firebase/firestore'
import { 
    collection, addDoc, onSnapshot, query, updateDoc,
    doc, increment, serverTimestamp, orderBy
} from 'firebase/firestore'

const route = useRoute()
const roomId = route.params.id
const newIdea = ref('')
const ideas = ref([])
const currentIndex = ref(1)
const currentKing = ref(null)

const startBattle = () => {
    if (ideas.value.length < 2) return
    currentKing.value = ideas.value[0]
    currentIndex.value = 1
}

const selectWinner = async (winner) => {
    const ideaRef = doc(db, "rooms", roomId, "ideas", winner.id)
    await updateDoc(ideaRef, {
        votes: increment(1)
    })
    currentKing.value = winner
    if (currentIndex.value < ideas.value.length - 1) {
        currentIndex.value++
    } else {
        currentIndex.value++
    }
}

const challenger = computed(() => {
    return ideas.value[currentIndex.value] || null
})

const addIdea = async () => {
    if (newIdea.value.trim() === '') return
    try {
        const ideasCollection = collection(db, "rooms", roomId, "ideas")
        await addDoc(ideasCollection, {
            text: newIdea.value,
            votes: 0,
            createdAt: serverTimestamp()
        })
        newIdea.value = ''
        console.log("Idea added")
    } catch (error) {
        console.error("Error adding idea: ", error)
        alert("ส่งข้อมูลไม่สำเร็จ เช็ค Firebase")
    }
}

onMounted(() => {
    const q = query(
        collection(db, "rooms", roomId, "ideas"),
        orderBy("createdAt", "asc")
    )
    onSnapshot(q, (snapshot) => {
        ideas.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}))
    })
})

const resetRoom = async() => {
    if (!confirm("คุณต้องการลบทั้งหมดใช่ไหม")) return
    const ideasCollection = collection(db, "rooms", roomId, "ideas")
    const snapshot = await getDocs(ideasCollection)

    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, "rooms", roomId, "ideas", document.id)))
    await Promise.all(deletePromises)

    currentKing.value = null
    currentIndex.value = 1
}

</script>

<template>
  <div class="min-h-screen bg-slate-900 text-white p-6">
    <header class="flex justify-between items-center mb-10">
      <h2 class="text-xl font-mono text-blue-400"># {{ roomId }}</h2>
      <router-link to="/" class="text-sm text-slate-400 hover:text-white underline">Leave Room</router-link>
    </header>

    <div class="max-w-2xl mx-auto">
      
      <div v-if="!currentKing">
        <div class="flex gap-2 mb-8">
          <input
            v-model="newIdea"
            @keyup.enter="addIdea"
            class="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Suggest an idea..."
          />
          <button @click="addIdea" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition">+</button>
        </div>

        <div v-if="ideas.length >= 2" class="mb-10 text-center">
          <button 
            @click="startBattle" 
            class="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-black text-xl shadow-lg hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-[1.02]"
          >
            START VERSUS MODE
          </button>
          <button @click="resetRoom" class="mt-4 text-red-500 text-sm underline block w-full text-center">
            Reset All Ideas
          </button>
        </div>

        <div class="grid gap-4">
          <div v-for="item in ideas" :key="item.id"
            class="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700 shadow-lg">
            <span class="text-lg">{{ item.text }}</span>
          </div>
        </div>
        
        <p v-if="ideas.length === 0" class="text-center text-slate-500 mt-10">No ideas yet. Be the first!</p>
      </div>

      <div v-else-if="currentKing && challenger" class="py-10">
        <h2 class="text-center text-2xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 italic">
          ROUND {{ currentIndex }}
        </h2>
        
        <div class="flex flex-col gap-6 items-center justify-center">
          
          <button @click="selectWinner(currentKing)" 
            class="w-full h-44 bg-gradient-to-br from-amber-500 to-orange-700 rounded-3xl shadow-2xl transform hover:scale-105 transition-all border-4 border-amber-300 relative overflow-hidden group">
            <div class="absolute top-2 left-2 bg-amber-300 text-amber-900 text-[10px] px-2 py-0.5 rounded font-black tracking-tighter">CURRENT KING</div>
            <span class="text-2xl font-bold text-white px-6 block group-hover:drop-shadow-md">{{ currentKing.text }}</span>
          </button>

          <div class="text-5xl font-black italic text-slate-700 my-2">VS</div>

          <button @click="selectWinner(challenger)" 
            class="w-full h-44 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl shadow-2xl transform hover:scale-105 transition-all border-4 border-blue-400 relative overflow-hidden group">
            <div class="absolute top-2 left-2 bg-blue-300 text-blue-900 text-[10px] px-2 py-0.5 rounded font-black tracking-tighter">CHALLENGER</div>
            <span class="text-2xl font-bold text-white px-6 block group-hover:drop-shadow-md">{{ challenger.text }}</span>
          </button>

        </div>

        <div class="mt-12 text-center">
          <div class="inline-block px-4 py-1 bg-slate-800 rounded-full border border-slate-700">
            <span class="text-slate-400 text-sm">Remaining Challengers: </span>
            <span class="text-blue-400 font-bold font-mono">{{ ideas.length - currentIndex - 1 }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20 bg-slate-800 rounded-3xl border-4 border-dashed border-slate-700">
        <h1 class="text-4xl font-black mb-4 text-yellow-400">🏆 WINNER!</h1>
        <p class="text-6xl font-bold mb-8">{{ currentKing.text }}</p>
        <button @click="currentKing = null" class="text-slate-400 hover:text-white underline">Back to Lobby</button>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { deleteDoc, getDocs } from 'firebase/firestore'
import { 
    collection, addDoc, onSnapshot, query, updateDoc,
    doc, increment, serverTimestamp, orderBy, getDoc, setDoc
} from 'firebase/firestore'

const route = useRoute()
const roomId = route.params.id
const newIdea = ref('')
const ideas = ref([])
const currentIndex = ref(1)
const currentKing = ref(null)
const roomData = ref({ participants: 0, status: 'open' })

const updateParticipants = async () => {
    const roomRef = doc(db, "rooms", roomId)
    await setDoc(roomRef, {
        participants: increment(1)
    }, { merge: true })
}

onMounted(() => {
    updateParticipants()

    onSnapshot(doc(db, "rooms", roomId), (doc) => {
        if (doc.exists()) {
            roomData.value = doc.data()
        }
    })

    const q = query(
        collection(db, "rooms", roomId, "ideas"),
        orderBy("createdAt", "asc")
    )
    onSnapshot(q, (snapshot) => {
        ideas.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}))
    })
})

const finishGame = async () => {
    const roomRef = doc(db, "rooms", roomId)
    await updateDoc(roomRef, { status: 'finished' })
}

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
    <header class="flex justify-between items-start mb-10 max-w-2xl mx-auto w-full">
      <div>
        <h2 class="text-xl font-mono text-blue-400"># {{ roomId }}</h2>
        <p class="text-xs text-slate-500">👥 {{ roomData.participants || 0 }} participants joined</p>
      </div>
      <router-link to="/" class="text-sm text-slate-400 hover:text-white underline">Leave Room</router-link>
    </header>

    <div class="max-w-2xl mx-auto">
      
      <div v-if="!currentKing && roomData.status !== 'finished'">
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
          <button @click="resetRoom" class="mt-4 text-red-500 text-xs opacity-50 hover:opacity-100 underline block w-full text-center">
            Reset All Ideas
          </button>
        </div>

        <div class="grid gap-4">
          <div v-for="item in ideas" :key="item.id"
            class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg italic text-slate-300">
            "{{ item.text }}"
          </div>
        </div>
        
        <p v-if="ideas.length === 0" class="text-center text-slate-500 mt-10 italic">Waiting for ideas...</p>
      </div>

      <div v-else-if="currentKing && challenger && roomData.status !== 'finished'" class="py-10">
        <h2 class="text-center text-2xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 italic">
          ROUND {{ currentIndex }}
        </h2>
        
        <div class="flex flex-col gap-6 items-center justify-center">
          <button @click="selectWinner(currentKing)" 
            class="w-full h-44 bg-gradient-to-br from-amber-500 to-orange-700 rounded-3xl shadow-2xl transform hover:scale-105 transition-all border-4 border-amber-300 relative overflow-hidden group">
            <div class="absolute top-2 left-2 bg-amber-300 text-amber-900 text-[10px] px-2 py-0.5 rounded font-black tracking-tighter">CURRENT KING</div>
            <span class="text-2xl font-bold text-white px-6 block group-hover:drop-shadow-md">{{ currentKing.text }}</span>
          </button>

          <div class="text-5xl font-black italic text-slate-800 my-2">VS</div>

          <button @click="selectWinner(challenger)" 
            class="w-full h-44 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl shadow-2xl transform hover:scale-105 transition-all border-4 border-blue-400 relative overflow-hidden group">
            <div class="absolute top-2 left-2 bg-blue-300 text-blue-900 text-[10px] px-2 py-0.5 rounded font-black tracking-tighter">CHALLENGER</div>
            <span class="text-2xl font-bold text-white px-6 block group-hover:drop-shadow-md">{{ challenger.text }}</span>
          </button>
        </div>

        <div class="mt-12 text-center text-slate-500 text-sm italic">
          Remaining: {{ ideas.length - currentIndex - 1 }}
        </div>
      </div>

      <div v-else-if="currentKing && !challenger && roomData.status !== 'finished'" class="text-center py-20 bg-slate-800 rounded-3xl border-4 border-dashed border-slate-700">
        <h1 class="text-4xl font-black mb-4 text-yellow-400">🏆 FINAL WINNER</h1>
        <p class="text-6xl font-bold mb-12 drop-shadow-lg text-white">{{ currentKing.text }}</p>
        
        <button @click="finishGame" class="px-10 py-4 bg-blue-600 rounded-full font-black text-xl hover:bg-blue-500 shadow-xl transition-all active:scale-95">
          PUBLISH RESULTS TO ALL
        </button>
      </div>

      <div v-else class="py-10">
        <h2 class="text-3xl font-black text-center mb-10 text-yellow-400">🏆 FINAL RANKING</h2>
        
        <div class="grid gap-3">
          <div v-for="(item, index) in [...ideas].sort((a,b) => b.votes - a.votes)" :key="item.id"
            class="bg-slate-800 p-5 rounded-2xl flex justify-between items-center border border-slate-700 shadow-xl"
            :class="{'border-yellow-500 ring-2 ring-yellow-500/20 scale-105': index === 0}"
          >
            <div class="flex items-center gap-5">
              <span class="text-3xl font-black" :class="index === 0 ? 'text-yellow-400' : 'text-slate-600'">#{{ index + 1 }}</span>
              <span class="text-xl font-bold">{{ item.text }}</span>
            </div>
            <div class="text-right">
              <span class="text-blue-400 font-mono font-black text-xl">{{ item.votes }}</span>
              <p class="text-[10px] text-slate-500 uppercase tracking-widest">Wins</p>
            </div>
          </div>
        </div>

        <button @click="resetRoom" class="mt-12 w-full text-slate-600 hover:text-red-500 text-sm underline transition">
          Clear and Restart New Lobby
        </button>
      </div>

    </div>
  </div>
</template>
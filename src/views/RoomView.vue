<template>
  <div class="min-h-screen bg-[#81D8D0] p-6 font-sans text-slate-900 transition-colors duration-500">
    <div class="max-w-2xl mx-auto">
      
      <div v-if="!showSpotlight" class="flex gap-4 mb-8 items-start">
        <button @click="$router.push('/')" 
          class="border-[3px] border-black px-4 py-2 font-bold rounded-xl bg-white hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          กลับหน้าหลัก
        </button>
        <div v-if="roomData.status === 'open'" class="flex-1 flex gap-2">
          <input v-model="newIdea" @keyup.enter="addIdea" 
            class="flex-1 border-[3px] border-black p-2 font-bold rounded-xl focus:outline-none" 
            placeholder="เพิ่มตัวเลือก..." />
          <button @click="addIdea" 
            class="border-[3px] border-black px-6 py-2 font-bold bg-blue-400 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
            เพิ่ม
          </button>
        </div>
      </div>

      <div v-if="roomData.status === 'open' && !showSpotlight">
        <div class="flex gap-8 mb-8 font-bold text-slate-600 px-2 bg-white/50 p-4 rounded-2xl border-2 border-black/10">
          <span>🚩 ตัวเลือก : {{ ideas.length }}</span>
          <span>👥 คนโหวตแล้ว : {{ roomData.voteCount || 0 }}</span>
        </div>

        <div class="space-y-4 mb-10">
          <div v-for="(item, idx) in ideas" :key="item.id" 
            class="border-[3px] border-black p-4 flex justify-between items-center bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span class="text-xl font-bold truncate pr-4">#{{ idx + 1 }} : {{ item.text }}</span>
            <div class="flex gap-2 shrink-0">
              <button @click="editIdea(item)" class="border-[2px] border-black px-4 py-1 font-bold text-sm rounded-lg bg-yellow-300">แก้ไข</button>
              <button @click="deleteIdea(item.id)" class="border-[2px] border-black px-4 py-1 font-bold text-sm rounded-lg bg-red-400 text-white">ลบ</button>
            </div>
          </div>
        </div>

        <button v-if="ideas.length >= 2" @click="startBattle" 
          class="w-full py-5 border-[4px] border-black font-black text-3xl rounded-2xl bg-green-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mb-6">
          เริ่ม Battle!
        </button>

        <div v-if="isCreator" class="grid grid-cols-1 gap-4 mt-12 p-6 border-t-4 border-dashed border-black/20">
          <button v-if="roomData.voteCount >= 1" @click="showGlobalResults = !showGlobalResults" 
            class="w-full py-4 border-[3px] border-black font-bold text-xl rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
            {{ showGlobalResults ? 'ปิดหน้าผลโหวต' : 'ดูผลโหวตรวม' }}
          </button>
          <button @click="deleteRoom" 
            class="w-full py-4 border-[3px] border-black font-bold text-xl rounded-2xl bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
            ลบห้องโหวตนี้
          </button>
        </div>

        <div v-if="showGlobalResults" class="mt-8 p-6 border-[4px] border-black bg-white rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)]">
            <h3 class="text-2xl font-black mb-6 text-center underline italic">VOTE RANKING</h3>
            <div class="space-y-3">
                <div v-for="(item, index) in [...ideas].sort((a,b) => b.votes - a.votes)" :key="item.id"
                    class="flex justify-between items-center p-3 border-b-2 border-slate-100">
                    <span class="font-bold text-lg">{{ index + 1 }}. {{ item.text }}</span>
                    <span class="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{{ item.votes || 0 }} WINS</span>
                </div>
            </div>
        </div>
      </div>

      <div v-else-if="roomData.status === 'voting' && !myWinner && !showSpotlight" class="text-center py-10">
        <div class="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
          <button @click="selectWinner(currentKing)" 
            class="w-full md:w-64 h-48 border-[4px] border-black flex items-center justify-center text-3xl font-black rounded-3xl bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-50 active:shadow-none transition-all p-6">
            {{ currentKing?.text }}
          </button>
          <span class="text-6xl font-black italic text-black/20">VS</span>
          <button @click="selectWinner(challenger)" 
            class="w-full md:w-64 h-48 border-[4px] border-black flex items-center justify-center text-3xl font-black rounded-3xl bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-50 active:shadow-none transition-all p-6">
            {{ challenger?.text }}
          </button>
        </div>
        <div class="inline-block bg-black text-white px-8 py-2 rounded-full font-bold text-lg">
            เหลืออีก : {{ ideas.length - currentIndex - 1 }} คู่
        </div>
      </div>

      <div v-if="showSpotlight" class="fixed inset-0 bg-[#81D8D0] z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <h2 class="text-3xl font-black mb-4 animate-bounce">AND THE WINNER IS...</h2>
        <div class="border-[8px] border-black p-12 text-6xl md:text-8xl font-black rounded-[50px] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white mb-8">
          🏆 {{ myWinner?.text }}
        </div>
        <p class="text-xl font-bold italic text-black/40">กำลังบันทึกคะแนนใน {{ countdown }}...</p>
      </div>

      <div v-if="myWinner && !showSpotlight" class="text-center py-20">
        <h2 class="text-4xl font-black mb-10 italic">Your Best Choice!</h2>
        <div class="inline-block border-[6px] border-black p-12 text-6xl font-black rounded-[40px] shadow-[15px_15px_0px_0px_rgba(0,0,0,0.1)] bg-white/80 mb-16">
          {{ myWinner?.text }}
        </div>
        <div class="flex justify-center">
            <button @click="resetBattle" class="font-black text-xl border-b-4 border-black hover:text-white transition-colors">โหวตใหม่อีกรอบ</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, increment, serverTimestamp, query, orderBy } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id
const myUserId = localStorage.getItem('voter_id')

const roomData = ref({})
const ideas = ref([])
const newIdea = ref('')
const myWinner = ref(null)
const currentIndex = ref(1)
const currentKing = ref(null)
const showGlobalResults = ref(false)
const showSpotlight = ref(false) // สถานะโชว์ผู้ชนะชั่วคราว
const countdown = ref(3) // เวลานับถอยหลัง

const isCreator = computed(() => roomData.value.creatorId === myUserId)

onMounted(() => {
  onSnapshot(doc(db, "rooms", roomId), (s) => {
    if(!s.exists()) return router.push('/')
    roomData.value = s.data()
  })
  onSnapshot(query(collection(db, "rooms", roomId, "ideas"), orderBy("createdAt", "asc")), (s) => {
    ideas.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

const addIdea = async () => {
  if (!newIdea.value) return
  await addDoc(collection(db, "rooms", roomId, "ideas"), { text: newIdea.value, votes: 0, createdAt: serverTimestamp() })
  await updateDoc(doc(db, "rooms", roomId), { ideaCount: increment(1) })
  newIdea.value = ''
}

const deleteIdea = async (id) => {
  await deleteDoc(doc(db, "rooms", roomId, "ideas", id))
  await updateDoc(doc(db, "rooms", roomId), { ideaCount: increment(-1) })
}

const editIdea = async (item) => {
  const newText = prompt("แก้ไขตัวเลือก:", item.text)
  if (newText) await updateDoc(doc(db, "rooms", roomId, "ideas", item.id), { text: newText })
}

const deleteRoom = async () => {
  if (confirm("🚨 ลบห้องโหวตนี้ถาวร?")) {
    await deleteDoc(doc(db, "rooms", roomId))
    router.push('/')
  }
}

const startBattle = () => {
  if (ideas.value.length < 2) return alert("ต้องมีอย่างน้อย 2 ตัวเลือก")
  roomData.value.status = 'voting'
  currentKing.value = ideas.value[0]
  currentIndex.value = 1
  myWinner.value = null
}

const selectWinner = async (winner) => {
  currentKing.value = winner
  if (currentIndex.value < ideas.value.length - 1) {
    currentIndex.value++
  } else {
    // โหมดจบการโหวต: โชว์ Spotlight
    myWinner.value = winner
    showSpotlight.value = true
    
    // เริ่มนับถอยหลัง 3 วิ
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        showSpotlight.value = false
        finishVote(winner)
      }
    }, 1000)
  }
}

const finishVote = async (winner) => {
    const ideaRef = doc(db, "rooms", roomId, "ideas", winner.id)
    await updateDoc(ideaRef, { votes: increment(1) })
    await updateDoc(doc(db, "rooms", roomId), { voteCount: increment(1) })
    countdown.value = 3 // รีเซ็ตตัวนับไว้ใช้รอบหน้า
}

const resetBattle = () => {
    myWinner.value = null
    roomData.value.status = 'open'
}

const challenger = computed(() => ideas.value[currentIndex.value])
</script>
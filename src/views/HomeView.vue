<template>
  <div class="min-h-screen bg-[#81D8D0] p-8 font-sans text-slate-900">
    <div class="max-w-3xl mx-auto">
      
      <div class="flex justify-between items-center mb-12">
        <h1 class="text-4xl font-black italic tracking-tighter">VERSUS LOBBY</h1>
        <button @click="createPoll" 
          class="border-[3px] border-black px-8 py-3 font-black text-xl bg-green-400 rounded-2xl hover:bg-green-500 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          สร้างโหวต +
        </button>
      </div>

      <div class="space-y-8">
        <div v-for="room in pollRooms" :key="room.id"
          class="border-[4px] border-black p-8 flex justify-between items-center bg-white rounded-[32px] shadow-[10px_10px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all group">
          <div>
            <h2 class="text-3xl font-black mb-3 group-hover:text-blue-600 transition-colors">{{ room.title }}</h2>
            <div class="flex gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>👥 โหวตแล้ว: {{ room.voteCount || 0 }}</span>
              <span>🚩 ตัวเลือก: {{ room.ideaCount || 0 }}</span>
            </div>
          </div>
          
          <button @click="$router.push(`/room/${room.id}`)"
            class="border-[3px] border-black px-10 py-4 font-black text-2xl bg-[#81D8D0] rounded-2xl hover:bg-[#6ec9c1] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
            ทำ
          </button>
        </div>
      </div>

      <div v-if="pollRooms.length === 0" class="text-center py-20 bg-white/30 rounded-[40px] border-4 border-dashed border-black/20">
        <p class="text-2xl font-bold text-black/40 italic">ยังไม่มีโพลในขณะนี้... สร้างเลย!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { collection, onSnapshot, query, setDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { nanoid } from 'nanoid'

const router = useRouter()
const pollRooms = ref([])

onMounted(() => {
  // ดึงข้อมูลเรียงตามเวลาที่สร้างล่าสุดขึ้นก่อน
  const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"))
  onSnapshot(q, (snapshot) => {
    pollRooms.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

const createPoll = async () => {
  const title = prompt("ระบุหัวข้อโหวต (เช่น เมนูไหนนัวสุด?):")
  if (!title) return

  const userId = localStorage.getItem('voter_id') || nanoid()
  localStorage.setItem('voter_id', userId)

  const roomId = nanoid(6).toUpperCase()
  await setDoc(doc(db, "rooms", roomId), {
    title: title,
    creatorId: userId,
    status: 'open',
    voteCount: 0,
    ideaCount: 0,
    createdAt: serverTimestamp()
  })
  router.push(`/room/${roomId}`)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;900&display=swap');
div {
  font-family: 'Kanit', sans-serif;
}
</style>
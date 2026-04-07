<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../firebase'
import { 
    collection, addDoc, onSnapshot, query, updateDoc,
    doc, increment, serverTimestamp, orderBy
} from 'firebase/firestore'

const route = useRoute()
const roomId = route.params.id
const newIdea = ref('')
const ideas = ref([])

const addIdea = async () => {
    if (newIdea.value.trim() === '') return
    try {
        const ideasCollection = collection(db, "rooms", roomId, "ideas")
        await addDoc(ideasCollection, {
            text: newIdea.value,
            votes: 0,
            createAt: serverTimestamp()
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
        orderBy("createdAt", "desc")
    )
    onSnapshot(q, (snapshot) => {
        ideas.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}))
    })
})

const vote = async (ideaId) => {
    const ideaRef = doc(db, "rooms", roomId, "ideas", ideaId)
    await updateDoc(ideaRef, {
        votes: increment(1)
    })
}
</script>

<template>
    <div class="min-h-screen bg-slate-900 text-white p-6">
        <header class="flex justify-between items-center mb-10">
            <h2 class="text-xl font-mono text-blue-400"># {{ roomId }}</h2>
            <router-link to="/" class="text-sm text-slate-400 hover:text-white underline">Leave Room</router-link>
        </header>

        <div class="max-w-2xl mx-auto">
            <div class="flex gap-2 mb-8">
                <input
                    v-model="newIdea"
                    @keyup.enter="addIdea"
                    class="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg"
                    placeholder="Suggest an idea..."
                />
                <button @click="addIdea" class="px-6 py-2 bg-purple-600 rounded-lg font-bold">+</button>
        </div>
        
            <div class="grid gap-4">
                <div v-for="item in ideas" :key="item.id"
                    class="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700 shadow-lg">
                    <span class="flex-lg">{{ item.text }}</span>
                    <div class="flex items-center gap-4">
                        <span class="font-mono text-blue-400 text-xl">{{ item.votes }}</span>
                        <button
                            @click="vote(item.id)"
                            class="p-2 bg-slate-700 hover:bg-green-600 rounded-lg transition"
                        >
                            Vote
                        </button>
                    </div>
                </div>
            </div>
            <p v-if="ideas.length === 0" class="text-center text-slate-500 mt-10">No ideas yet. Be the first</p>
        </div>
    </div>
</template>
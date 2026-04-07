<script setup>
import { TemplateGenerativeModel } from 'firebase/ai'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomName = ref('')

const joinRoom = () => {
    if (roomName.value.trim()) {
        router.push(`/room/${roomName.value.trim().toLowerCase()}`)
    }
}
</script>

<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h1 class="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Idea Versus
        </h1>
        <div class="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
            <label class="block mb-2 text-sm text-slate-400">Enter Room Name</label>
            <input
                v-model="roomName"
                type="text"
                placeholder="e.g. project-x-meeting"
                class="w-full p-3 bg=slate-900 border-slate-600 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
            />
            <button
                @click="joinRoom"
                class="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
            >
                Create or Join Room
            </button>
        </div>
    </div>
</template>
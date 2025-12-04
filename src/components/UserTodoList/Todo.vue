<template>
  <li :class="{ completed: todo.done, editing: editing }" class="todo">
    <el-row>
      <div class="view">
        <el-col :span="4">
          <!-- <input
            :checked="todo.status"
            class="toggle"
            type="select"
            @change="toggleTodo( todo)"
            border
          > -->
          <el-select v-model="todo.status" placeholder="状态" clearable class="filter-item" @change="toggleTodo( todo)">
            <el-option v-for="item in statusList" :key="item.key" :label="item.display_name" :value="item.display_name" />
          </el-select>
        </el-col>
        <el-col :span="14">
          <label @dblclick="editing = true" v-text="todo.title" />
        </el-col>
        <el-col :span="4">
          <el-autocomplete
            v-model="todo.user_name"
            :fetch-suggestions="queryItemCodeSearch"
            class="filter-item"
            placeholder="责任人"
          />
        </el-col>
        <el-col :span="2">
          <button class="destroy" @click="deleteTodo( todo )" />
        </el-col>
      </div>
    </el-row>
    <input
      v-show="editing"
      v-focus="editing"
      :value="todo.title"
      class="edit"
      @keyup.enter="doneEdit"
      @keyup.esc="cancelEdit"
      @blur="doneEdit"
    >
  </li>
</template>


<script>
import {globalValUsers} from '@/globals'

export default {
  name: 'Todo',
  directives: {
    focus(el, { value }, { context }) {
      if (value) {
        context.$nextTick(() => {
          el.focus()
        })
      }
    }
  },
  props: {
    todo: {
      type: Object,
      default: function() {
        return {}
      }
    }
  },
  data() {
    return {
      editing: false,
      queryString: "",
      options: [],
      statusList: [
        { key: '已完成', display_name: '已完成' },
        { key: '未完成', display_name: '未完成' },
        { key: '延期完成', display_name: '延期完成' },
      ],
    }
  },
  methods: {
    querySearch(query) {
      if (query !== '') {
        this.options = this.fuse.search(query)
      } else {
        this.options = []
      }
    },
    queryItemCodeSearch(queryString, cb){
      console.log(queryString, globalValUsers);
      let results = queryString
        ? globalValUsers.filter(item => item.value.includes(queryString))
        : globalValUsers;
      cb(results)
    },
    deleteTodo(todo) {
      this.$emit('deleteTodo', todo)
    },
    editTodo({ todo, value }) {
      this.$emit('editTodo', { todo, value })
    },
    toggleTodo(todo) {
      this.$emit('toggleTodo', todo)
    },
    doneEdit(e) {
      const value = e.target.value.trim()
      const { todo } = this
      if (!value) {
        this.deleteTodo({
          todo
        })
      } else if (this.editing) {
        this.editTodo({
          todo,
          value
        })
        this.editing = false
      }
    },
    cancelEdit(e) {
      e.target.value = this.todo.title
      this.editing = false
    }
  }
}
</script>

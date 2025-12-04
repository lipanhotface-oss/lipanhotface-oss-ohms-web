<template>
  <div class="board-column">
    <div class="board-column-header">
      <div class="board-header-title">{{ headerText }}</div>
      <el-button icon="el-icon-edit" class="board-header-btn" type="primary" @click="editWorks">编辑</el-button>
    </div>
    <draggable
      :list="list"
      v-bind="$attrs"
      class="board-column-content"
      :set-data="setData">
      <div v-if="list.length > 0">
        <div  v-for="element in list" :key="element.id" class="board-item">
          <div style="width:60%;min-width:200px;word-wrap:break-word;word-break:break-all;white-space:normal;">
            <i v-if="element.status=='未完成'" class="el-icon-s-order"  style="color:#ffc833 ;padding-right:10px;"/>
            <i v-else class="el-icon-s-claim" style="color:#42d885"/>
            {{ element.task_name }}
          </div>
          <div style="width:17%;margin-left:10px;">
            <el-alert :closable="false" class="el-icon-user-solid" style="width:120px;" :title="element.user_name" type="success" />
          </div>
          <div style="width:18%;margin-left:10px;">
            <el-alert :closable="false" class="el-icon-time" style="width:120px;" :title="element.deadline" type="success" />
          </div>
          <div style="width:10%;margin-left:10px;">
            <el-button v-if="element.status=='未完成'" size="mini" type="primary">{{getFinishBtnName()}} </el-button>
            <el-button v-else size="mini" :disabled="true">{{getFinishBtnName()}}</el-button>
          </div>
        </div>
      </div>
      <div v-else class="board-item">
        <div style="width:400px;word-wrap:break-word;word-break:break-all;white-space:normal;">{{getWariningTitle()}}</div>
      </div>
    </draggable>
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="50%"
      :before-close="handleClose"
      center>
      <el-form :model="plan_form" label-width="100px" class="demo-ruleForm">
        <el-row>
          <el-col :span="12">
            <el-form-item :label="getLabel()">
              <el-input v-model="plan_form.taskName" placeholder="请输入计划任务名称" style="width: 300px"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人">
              <el-autocomplete
                v-model="plan_form.user_name"
                :fetch-suggestions="queryItemCodeSearch"
                class="filter-item"
                placeholder="责任人"
                style="width: 300px"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="预计完成时间">
              <el-date-picker
                v-model="plan_form.deadline"
                type="date"
                placeholder="选择日期时间"
                value-format="yyyy-MM-dd"
                style="width: 300px">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
              <!-- 添加计划按钮 -->
            <el-form-item  label="" center>
              <el-button type="primary" @click="addPlan">添加计划</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <!-- 当前计划列表 -->
      <el-table :data="plan_list" border  style="width: 100%;overflow-y:auto;" :height="400" fit highlight-current-row :sticky-header="true">
        <el-table-column prop="task_name" align="center" label="任务名称" width="480"/>
        <el-table-column prop="user_name" align="center" label="责任人" width="100"/>
        <el-table-column prop="deadline" align="center" label="完成时间" width="100"/>
        <el-table-column prop="status" align="center" label="是否完成" width="125">
          <template slot-scope="scope">
            <el-select v-model="scope.row.status" class="filter-item" placeholder="状态">
              <el-option v-for="item in ['未完成', '已完成', '暂不处理']" :key="item" :label="item" :value="item" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template slot-scope="scope">
            <el-button 
              type="danger" 
              size="mini" 
              @click="deletePlan(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer" >
        <el-button @click="handleClose">取消保存</el-button>
        <el-button @click="savePlans" type="primary">保存计划</el-button>
      </span>
    </el-dialog>
    <el-popover
      placement="top"
      width="160"
      v-model="isDelete">
      <p>确认取消编辑吗？</p>
      <div style="text-align:right;margin:0;">
        <el-button size="mini" type="text" @click="">取消</el-button>
        <el-button size="mini" type="text" @click="">确认</el-button>
      </div>
    </el-popover>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import {globalValUsers} from '@/globals'
export default {
  name: 'DragKanbanDemo',
  components: {
    draggable
  },
  props: {
    headerText: {
      type: String,
      default: 'Header'
    },
    dialogTitle: {
      type: String,
      default: '编辑计划'
    },
    options: {
      type: Object,
      default() {
        return {}
      }
    },
    list: {
      type: Array,
      default() {
        return []
      }
    }
  },
  data(){
    return {
      dialogVisible: false,
      isDelete: false,
      plan_form: {
        task_name: '',
        deadline: '',
        user_name: ''
      },
      plan_list: [],
      this_week_number: '',
      before_week_number: '',
      next_week_number: '',
      this_month_number: '',
      before_month_number: '',
      next_month_number: ''
    }
  },
  computed: {
    editableList() {
      return [...this.list]; // 返回副本
    }
  },
  methods: {
    getLabel(){
      if(this.dialogTitle == "月度重点目标"){
        return "重点目标"
      }else if(this.dialogTitle == "存在的问题"){
        return "存在的问题"
      }else{
        return "计划任务"
      }
    },
    getFinishBtnName(){
      if(this.dialogTitle == "月度重点目标"){
        return "完成"
      }else if(this.dialogTitle == "存在的问题"){
        return "已解决"
      }else{
        return "完成"
      }
    },
    getWariningTitle(){
      if(this.dialogTitle == "月度重点目标"){
        return "任务都处理完啦，继续加油！"
      }else if(this.dialogTitle == "存在的问题"){
        return "项目进展顺利，暂时没有问题哦！"
      }else if (this.dialogTitle == "上周工作计划"){
        return "上周没有工作计划，请复盘下项目进展是否顺利！"
      }else if (this.dialogTitle == "上周完成情况"){
        return "上周没有已完成工作，请复盘下项目进展是否顺利！"
      }else if (this.dialogTitle == "本周工作计划"){
        return "本周没有工作计划，请复盘下项目进展是否顺利！"
      }else if (this.dialogTitle == "本周完成情况"){
        return "本周还没有已完成工作，请继续加油！"
      }else if (this.dialogTitle == "下周工作计划"){
        return "还没添加下周工作，请尽快安排哦！"
      }
    },
    handleClose(done){
      this.$confirm('确认关闭?', {
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消关闭'
      }).then(action => {
        if(action == "confirm"){
          console.log("关闭");
          this.$message({
            message: '已关闭编辑窗口!',
            type: 'success'
          });
          this.dialogVisible = false; // ✅ 直接关闭对话框
          done();
        }
        
      }).catch(action => {
        if(action == 'cancel'){
          console.log("取下关闭");
          this.$message({
            message: '已取消关闭2222222222222222222!',
            type: 'success'
          })
          done(false);
        }
      });
      // this.isDelete = true
    },
    // 添加计划
    addPlan() {
      if (!this.plan_form.taskName || !this.plan_form.deadline || !this.plan_form.user_name) {
        this.$message.error('请填写完整信息');
        return;
      }
      this.plan_list.push({
        id: Date.now(),
        user_name: this.plan_form.user_name,
        task_name: this.plan_form.taskName,
        deadline: this.plan_form.deadline,
        status: "未完成"
      });
      // 清空表单，准备下一次输入
      this.plan_form = { taskName: '', deadline: '' };
    },
        // 删除计划
    deletePlan(index) {
      this.plan_list.splice(index, 1);
    },
    savePlans(){
      // this.list = JSON.parse(JSON.stringify(this.plan_list))
      console.log(this.dialogTitle);
      if(this.dialogTitle == "月度重点目标"){
        this.this_month_number = this.getWeekDates("month", 0)
        console.log(this.this_month_number);
      }else if(this.dialogTitle == "存在的问题"){
        this.this_month_number = this.getWeekDates("month", 0)
        console.log(222);
      }else if (this.dialogTitle == "上周工作计划"){
        this.before_week_number = this.getWeekDates("week",-1)
        console.log(333);
      }else if (this.dialogTitle == "上周完成情况"){
        this.before_week_number = this.getWeekDates("week",-1)
        console.log(444);
      }else if (this.dialogTitle == "本周工作计划"){
        this.this_week_number = this.getWeekDates("week", 0)
        console.log(555);
      }else if (this.dialogTitle == "本周完成情况"){
        this.this_week_number = this.getWeekDates("week", 0)
        console.log(666);
      }else if (this.dialogTitle == "下周工作计划"){
        this.next_week_number = this.getWeekDates("week",1)
        console.log(777);
      }
      this.$emit('update:list', this.plan_list); // 通知父组件更新
      this.dialogVisible = false
    },
    setData(dataTransfer) {
      // to avoid Firefox bug
      // Detail see : https://github.com/RubaXa/Sortable/issues/1012
      dataTransfer.setData('Text', '')
    },
    editWorks(){
      console.log("this.plan_list create");
      this.plan_list =  JSON.parse(JSON.stringify(this.list))
      console.log("this.plan_list", this.plan_list);
      this.dialogVisible = true
    },
    queryItemCodeSearch(queryString, cb){
      console.log(queryString, globalValUsers);
      let results = queryString
        ? globalValUsers.filter(item => item.value.includes(queryString))
        : globalValUsers;
      cb(results)
    },
    /**
    * 获取日期范围（周/月）
    * @param {string} type - 类型：'week' 或 'month'
    * @param {number} offset - 偏移量（默认为0）
    * @returns {string} 日期范围字符串
    */
    getWeekDates(type = 'week', offset = 0) {
      const today = new Date();
      const year = today.getFullYear();
      if (type === 'week') {
        const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        let monday = new Date(today);
        // 原来的周函数逻辑
        // 返回格式：20250609-20250615
        // 计算当前周的星期一
        if (dayOfWeek !== 0) {
          monday.setDate(today.getDate() - (dayOfWeek - 1)); // 非周日的情况
        } else {
          monday.setDate(today.getDate() - 6); // 如果是周日，则减6天得到上周的星期一
        }
        // 计算当前周的星期日
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        // 根据 offset 调整周一和周日
        const adjustedMonday = new Date(monday);
        adjustedMonday.setDate(monday.getDate() + 7 * offset);
        const adjustedSunday = new Date(sunday);
        adjustedSunday.setDate(sunday.getDate() + 7 * offset);
        // 格式化日期为 YYYYMMDD
        const format = (date) => {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}${month}${day}`;
        };
        return `${format(adjustedMonday)}-${format(adjustedSunday)}`;
      } else if (type === 'month') {
        // 月函数逻辑（如上）
        // 返回格式：202508
        // 计算目标月份（总月份数）
        let month = today.getMonth(); // 0-11
        // 计算目标月份（总月份数）
        const totalMonths = year * 12 + month;
        const targetTotal = totalMonths + offset;
        // 获取调整后的年份和月份
        const newYear = Math.floor(targetTotal / 12);
        const newMonth = targetTotal % 12;
        // 格式化为 YYYYMM
        const formattedMonth = String(newMonth + 1).padStart(2, '0'); // 月份从1开始
        return `${newYear}${formattedMonth}`;
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.board-column {
  width: 45%;
  min-height: 100px;
  height: auto;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 3px;

  .board-column-header {
    height: 50px;
    display: flex;
    justify-content: space-between;
  }
  .board-header-title {
    width:85%;
    height: 50px;
    line-height: 50px;
    overflow: hidden;
    padding: 0 20px;
    text-align: center;
    background: #333;
    color: #fff;
    border-radius: 3px 0px 0 0;
  }
  .board-header-btn {
    width:15%;
    height: 50px;
    line-height: 50px;
    overflow: hidden;
    padding: 0 20px;
    text-align: center;
    background: gray;
    // color: #fff;
    border-radius: 0px 3px 0 0;
  }
  .board-column-content {
    height: auto;
    overflow: hidden;
    border: 10px solid transparent;
    min-height: 40px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    // align-items: center;

    .board-item {
      cursor: pointer;
      width: 100%;
      margin: 5px 0;
      background-color: #fff;
      color: black;
      text-align: left;
      line-height: 34px;
      padding:5px 0px 5px 10px;
      box-sizing: border-box;
      display: flex;
      justify-content: space-between center;
      align-items:center;
      box-shadow: 0px 1px 3px 0 rgba(0, 0, 0, 0.2);
      .el-alert{
        padding: 8px;
      }
    }
  }
}
</style>


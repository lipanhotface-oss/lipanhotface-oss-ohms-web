<template>
  <div class="app-container1">  
    <div style="margin:0 0 10px 0">
      <!-- <el-button v-waves class="filter-item" type="primary" icon="el-icon-back" @click="backItemManager" style="margin-left:5px;">
        返回项目管理
      </el-button> -->
      <router-link class="pan-btn blue-btn" to="/item-schedule/index">
        返回项目管理
      </router-link>
    </div>
    <div style="width:100%;height:80vh;">
      <div style="width:100%;height:80vh;overflow-y:scroll">
        <div class="div-container">
          <div class="span-container">课题代号:</div><el-input v-model="itemInfo.item_code" :disabled="true" style="width:30%"  placeholder="请输入……"/>
          <div class="span-container">项目名称:</div><el-input v-model="itemInfo.item_name" :disabled="true" style="width:30%"  placeholder="请输入……"/>
        <!-- </div>
        <div class="div-container"> -->
          <div class="span-container">要求验收时间:</div><el-input v-model="itemInfo.finish_date" :disabled="true" style="width:30%"  placeholder="请输入……"/>
          
        </div>
        <div class="div-container">
          <div class="span-container">项目负责人:</div><el-input v-model="itemInfo.item_leader" :disabled="true" style="width:30%"  placeholder="请输入……"/>
          <div class="span-container">片区总监:</div><el-input v-model="itemInfo.area_user" :disabled="true" style="width:30%"  placeholder="请输入……"/>
          <div class="span-container">销售人员:</div><el-input v-model="itemInfo.sales_user" :disabled="true" style="width:30%"  placeholder="请输入……"/>
        </div>
        <div class="div-container">
          <div class="span-container" style="margin-left:-22px;">部门经理:</div><el-input v-model="itemInfo.dept_manager" :disabled="true" style="width:25.4%"  placeholder="请输入……"/>
        </div>
        <el-collapse
          v-model="activeCollapse"
          border
          :accordion="false"
          >
          <el-collapse-item name='1' title="存在的问题&月度重点目标" class="collapse_style">
            <div class="item-container">
              <Kanban key="month" :list.sync="plan_infos.month_plan" :group="group" class="kanban todo" style="margin-left:50px;" header-text="月度重点目标" dialogTitle="月度重点目标"/>
              <Kanban key="problems" :list.sync="plan_infos.item_problem" :group="problem_group" class="kanban working" style="margin-right:50px;" header-text="存在的问题" dialogTitle="存在的问题"/>
            </div>
          </el-collapse-item>
          <el-collapse-item name='2' title="上周工作计划&完成情况" class="collapse_style">
            <div class="item-container">
              <Kanban key="before_plans" :list.sync="plan_infos.before_week_plans" :group="problem_group" class="kanban working" style="margin-left:50px;" header-text="上周工作计划" dialogTitle="上周工作计划"/>
              <Kanban key="before_week_finish" :list.sync="plan_infos.before_week_finish_plan" :group="problem_group" class="kanban working" style="margin-right:50px;" header-text="上周完成情况" dialogTitle="上周完成情况"/>
            </div>
          </el-collapse-item>
          <el-collapse-item name='3' title="本周工作计划&完成情况" class="collapse_style">  
            <div class="item-container">
              <Kanban key="this_week_plans" :list.sync="plan_infos.this_week_plans" :group="problem_group" class="kanban working" style="margin-left:50px;" header-text="本周工作计划" dialogTitle="本周工作计划"/>
              <Kanban key="this_week_finish" :list.sync="plan_infos.this_week_finish_plan" :group="problem_group" class="kanban working" style="margin-right:50px;" header-text="本周完成情况" dialogTitle="本周完成情况"/>
            </div>
          </el-collapse-item>
          <el-collapse-item name="4" title="下周工作计划" class="collapse_style">
            <div class="item-container">
              <Kanban key="next_week_plans" :list.sync="plan_infos.next_week_plans" :group="problem_group" class="kanban working" style="margin-left:50px;" header-text="下周工作计划" dialogTitle="下周工作计划"/>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>

</template>

<script>
import request from '@/utils/request'
import { getWeekDates } from '@/utils/get-week-date'
import { getItemWeekPlans } from '@/api/item_schedule'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import TodoList from '@/components/UserTodoList'
import Kanban from './Kanban'
export default {
  name: 'ComplexTable',
  components: { 
    TodoList,
    Kanban
    },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        售前: 'success',
        售中: 'info',
        售后: 'danger'
      }
      return statusMap[status]
    },
  },
  data() {
    return {
      group: 'month_plan',
      problem_group: "problem",
      date_range:{
        this_week_number: "",
        before_week_number: "",
        next_week_number: "",
        this_month_number: "",
        before_month_number: "",
        next_month_number: ""
      },
      activeCollapse: ["1", "3"],
      deptManagerList: [
        { key: '测控部门经理', display_name: '古明锋' },
        { key: '测控软件部门经理', display_name: '段海彬' },
        { key: '民机部门经理', display_name: '于勇' },
        { key: '片区', display_name: '雷猛' }
      ],
      itemNameList:  [
        "AAA", "BBB"
      ],
      itemLeaderList: [
        { key: '测控部门经理', display_name: '古明锋' },
        { key: '测控软件部门经理', display_name: '段海彬' },
        { key: '民机部门经理', display_name: '于勇' },
        { key: '片区', display_name: '雷猛' }
      ],
      areaUserList: [
        { key: '测控部门经理', display_name: '古明锋' },
        { key: '测控软件部门经理', display_name: '段海彬' },
        { key: '民机部门经理', display_name: '于勇' },
        { key: '片区', display_name: '雷猛' }
      ],
      itemInfo: {},
      plan_infos: {
        next_week_plan: [],
        month_plan: [],
        item_problem: [],
        before_plans: [],
        before_week_finish_plan: [],
        this_week_plans: [],
        this_week_finish_plan:[],
        next_week_plans: []
      },
      user_info: {},


      listLoading: true,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published',
      },
    }
  },
  async created() {
    const item_info = this.$route.query.item_info;
    console.log("item_info", item_info);
    this.itemInfo = item_info
    this.toGetWeekDates()
    this.getList(item_info)
  },
  methods: {
    toGetWeekDates(){
      this.date_range.this_week_number = this.getWeekDates("week", 0)
      this.date_range.before_week_number = this.getWeekDates("week",-1)
      this.date_range.next_week_number = this.getWeekDates("week",1)
      this.date_range.this_month_number = this.getWeekDates("month", 0)
      this.date_range.before_month_number = this.getWeekDates("month",-1)
      this.date_range.next_month_number = this.getWeekDates("month",1)
      console.log(this.getWeekDates("month",-10), this.getWeekDates("week",-10));
      console.log(this.date_range);
    },
    async getList(item_info) {
      this.listLoading = true
      const query = {
        item_name: item_info.item_name,
        item_code: item_info.item_code,
        this_week_number: this.date_range.this_week_number,
        before_week_number: this.date_range.before_week_number,
        next_week_number: this.date_range.next_week_number,
        this_month_number: this.date_range.this_month_number
      }
      getItemWeekPlans(query).then(response => {
        console.log(response.data);
        this.plan_infos = response.data
        // this.itemInfo.next_week_plan = response.data[0].week_plans[0].plans
        // this.$set(this.itemInfo, 'next_week_plan', response.data[0].week_plans[0].plans)
        console.log("this.itemInfo", this.itemInfo, query);
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },    
    /**
    * 获取日期范围（周/月）
    * @param {string} type - 类型：'week' 或 'month'
    * @param {number} offset - 偏移量（默认为0）
    * @returns {string} 日期范围字符串
    */
    getWeekDates(type = 'week', offset = 0) {
      console.log("getWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDates");
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
.div-container {
  display: flex;
  flex:left;
  margin: 0 0 5px 0;
}
.item-container {
  display: flex;
  justify-content: space-between;
  // flex:left;
  margin: 0 0 5px 0;
}
.span-container {
  margin: 8px 0 0 0; 
  text-align: right;
  width:150px;
}
.kanban {
  &.todo {
    .board-column-header {
      background: #4A9FF9;
    }
  }
  &.working {
    .board-column-header {
      background: #f9944a;
    }
  }
  &.done {
    .board-column-header {
      background: #2ac06d;
    }
  }
}
</style>
<template>
  <div class="app-container1">
    <div class="filter-container">
      <el-text tag="b">课题代号:</el-text>
      <!-- <el-input v-model="listQuery.title" placeholder="课题代号"  style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" /> -->
      <el-autocomplete
        v-model="listQuery.item_code"
        :fetch-suggestions="queryItemCodeSearch"
        clearable
        class="filter-item"
        placeholder="请输入课题代号"
      />
      <el-text style="margin-left:5px;" tag="b"> 项目名称:</el-text>
      <!-- <el-select v-model="listQuery.item_name" placeholder="项目名称" clearable style="width: 160px;" class="filter-item">
        <el-option v-for="item in itemNameList" :key="item" :label="item" :value="item" />
      </el-select> -->
      <el-autocomplete
        v-model="listQuery.item_name"
        :fetch-suggestions="queryItemNameSearch"
        clearable
        class="filter-item"
        placeholder="请输入项目名称"
      />
      <el-text style="margin-left:5px;" tag="b"> 项目负责人:</el-text>
      <el-select v-model="listQuery.item_leader" placeholder="项目负责人" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in itemLeaderList" :key="item.key" :label="item.display_name" :value="item.display_name" />
      </el-select>
      <el-text style="margin-left:5px;" tag="b"> 片区总监:</el-text>
      <el-select v-model="listQuery.area_user" placeholder="片区总监" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in areaUserList" :key="item.key" :label="item.display_name" :value="item.display_name" />
      </el-select>
      <el-text style="margin-left:5px;" tag="b"> 部门经理:</el-text>
      <el-select v-model="listQuery.dept_manager" placeholder="部门经理" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in deptManagerList" :key="item.key" :label="item.display_name" :value="item.display_name" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter" style="margin-left:5px;">
        搜索
      </el-button>
    </div>
    <div style="float:left;width:100%">
      <el-table
        :key="itemTableKey"
        v-loading="itemListLoading"
        :data="item_list"
        border
        fit
        highlight-current-row
        style="width: 100%;"
        height="80vh"
        @sort-change="sortChange"
      >
        <el-table-column label="序号" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
          <template slot-scope="{row, $index}">
            <span>{{ (currentPage - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="项目名称" min-width="150px">
          <template slot-scope="{row}">
            <span class="link-type" @click="handleUpdate(row)">{{ row.item_name }}&nbsp;&nbsp;</span>
          </template>
        </el-table-column>
        <el-table-column label="课题代号" min-width="100px" align="center">
          <template slot-scope="{row}">
              <span>{{ row.item_code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100px" min-width="150px" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.item_status | statusFilter">
              <span>{{ row.item_status }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="销售人员" width="100px" align="center">
          <template slot-scope="{row}">
            <span v-if="row.sales_user">{{ row.sales_user }}</span>
              <!-- <el-select v-else>
              </el-select> -->
            <!-- <el-autocomplete
              v-model="listQuery.item_code"
              :fetch-suggestions="queryItemCodeSearch"
              clearable
              class="filter-item"
              placeholder="请输入"
            /> -->
              <!-- <span v-else>请选择</span> -->
          </template>
        </el-table-column>
        <el-table-column label="项目负责人" width="100px" align="center">
          <template slot-scope="{row}">
              <span>{{ row.item_leader }}</span>
          </template>
        </el-table-column>
        <el-table-column label="部门经理" width="100px" align="center">
          <template slot-scope="{row}">
              <span>{{ row.dept_manager }}</span>
          </template>
        </el-table-column>
        <el-table-column label="周工作完成情况" width="100px" min-width="150px" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.this_week_plan_status | planFilter">
              <span>{{ row.this_week_plan_status }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="月工作延期数量" width="100px" min-width="150px" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.month_plan_delay | monthPlanFilter">
              <span>{{ row.month_plan_delay }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
          <template slot-scope="{row,$index}">
            <router-link class="table-pan-btn table-light-blue-btn" :to="{path: '/item-schedule/item_info/index', query:{'item_info':row}}">
              查看
            </router-link>
            <el-button type="primary" size="mini" @click="warnPlan('delay')">
              延期提醒
            </el-button>
            <el-button type="primary" size="mini" @click="warnPlan('all')">
              未完成提醒
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'
import { fetchList, fetchPv, createArticle, updateArticle } from '@/api/article'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { getUserInfo } from '@/api/role'
import TodoList from '@/components/TodoList'

export default {
  name: 'ComplexTable',
  components: { 
    Pagination,
    TodoList
    },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        未更新: 'danger',
        售前: 'success',
        售中: 'info',
        售后: 'danger'
      }
      return statusMap[status]
    },
    planFilter(progress) {
      let status = 'info'
      if(progress == "0%"){
        status = 'danger'
      }else if(progress == "100%"){
        status = 'success'
      }
      return status
    },
    monthPlanFilter(count) {
      let status = 'danger'
      if(count == 0){
        status = 'success'
      }
      return status
    },
  },
  data() {
    return {
      currentPage:1,
      pageSize:10,
      deptManagerList: [
        { key: '测控部门经理', display_name: '古明锋' },
        { key: '测控软件部门经理', display_name: '段海彬' },
        { key: '民机部门经理', display_name: '于勇' },
        { key: '片区', display_name: '雷猛' }
      ],
      item_code: "",
      item_name: "",
      itemNameList:  [],
      itemCodeList: [],
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
      tableKey: 0,
      itemTableKey: 0,
      user_info: {},
      list: null,
      item_list: null,
      listLoading: true,
      itemListLoading: false,
      listQuery: {
        area_user: "",
        dept_manager: "",
        item_leader: "",
        item_name: "",
        item_code: "",
        status: ''
      },
      importanceOptions: ["网络机柜 ", "离散量输出卡", "模拟量输入卡"],
      sortOptions: [{ label: '优选值升序', key: '+' }, { label: '优选值降序', key: '-' }],
      statusOptions: ['台', '个', '套', '米', '块', '片', '只'],
      showReviewer: false,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      textMap: {
        update: '编辑',
        create: '添加'
      },
      rules: {
        units: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        name: [{ required: true, message: 'title is required', min:2, max:30, trigger: 'blur' }],
        manufactures: [{ required: true, message: '请输入厂家名称', min:2, max:30, trigger: 'blur' }],
        cost_price: [{ required: true, message: '请输入', min:0, trigger: 'blur' }],
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
    this.getItemLeaderList()
    //this.getUserInfo()
  },
  methods: {
    async getList() {
      this.listLoading = true
      const result = await request.get('/itemSchedule/get_all_item', {params:this.listQuery})
      console.log(this.item_list);
      this.item_list = result.data
      this.itemNameList = this.convertNameToValue(this.item_list)
      console.log(this.itemNameList)
      this.itemCodeList = this.convertCodeToValue(this.item_list)
      console.log(this.itemCodeList)
      this.listLoading = false
    },
    getItemLeaderList(){
      const org_list = ['刘政', '徐怀勇', '王超', '吴鹏伟', '乔维涛', '古明锋', '王亚玉', '石宏亮', '段海彬', '范勇', '黄西瑞', '薛冠宇', '雷猛', '胡凯', '王少宇', '屈宸光', '高艳军', '张童', '张毅', '李乐', '王鹏飞', '李博', '高涛', '何一甲', '贺坤', '任佳莉', '于勇', '刘星雨', '雷飞', '杨思雨', '袁晨钊', '上恒恒', '郑宏社', '李楠', '罗卫国', '张宏哲', '李明', '宋伦', '王睿洲', '高春燕', '', '成博', '闫驰', '刘国威', '李蓓蕾', '马晓辉', '赵辰雪', '段张强', '金召寿', '付朝娟', '焦彤', '周年', '马铭徽', '宁哲', '陈亮', '张碧轩', '张煜', '祝小凡', '许岩', '刘佳明', '王福', '高振番', '梁涛', '谢炅阳', '代冬林', '马文彬', '康帅', '王金华', '马玉洁', '毛家琪', '杜宇乐', '李攀', '徐朝辉', '李鹏程', '田永全', '刘红斌', '郭永涛', '李鑫', '李超', '张康', '杜凯']
      this.itemLeaderList = org_list.map(item => ({
        key: item,
        display_name: item
      }));
      console.log("this.itemLeaderList", this.itemLeaderList);
    },
    warnPlan(warn_type){
      console.log("warn_type", warn_type);
    },
    async getUserInfo(){
      try{
          console.log(123)
          const user_info = await request.get({path:'/hardwave/get_all_gard', params:{page:1,pageSize:10}})
          //const user_info = await this.$axios.get('/hardwave/get_all_gard')
          console.log(23242526,user_info)
      } catch(error){
        console.log(265265, error)}
    },
    queryItemCodeSearch(queryString, cb){
      console.log(this.item_code, queryString, this.itemCodeList);
      let results = queryString
        ? this.itemCodeList.filter(item => item.value.includes(queryString))
        : this.itemCodeList;
      cb(results)
    },
    queryItemNameSearch(queryString, cb){
      console.log(this.item_code, queryString, this.itemNameList);
      let results = queryString
        ? this.itemNameList.filter(item => item.value.includes(queryString))
        : this.itemNameList;
      cb(results)
    },
    convertNameToValue(array){
      let results = array.map(item => ({
        value: item.item_name
      }));
      // results = [...new Map(results.map(item => [item.value, item])).values()];
      // results.sort((a, b) => a.value.localCompare(b.value))
      return results
    },
    convertCodeToValue(array){
      let results = array.map(item => ({
        value: item.item_code
      }));
      // results = [...new Map(results.map(item => [item.value, item])).values()];
      // results.sort((a, b) => a.value.localCompare(b.value))
      return results
    },
    handleFilter() {
      console.log(this.listQuery)
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+'
      } else {
        this.listQuery.sort = '-'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
          createArticle(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
<style lang="scss" scoped>
.div-container {
  display: flex;
  margin: 0 0 5px 0;
}
.span-container {
  margin: 8px 0 0 0; 
  text-align: right;
  width:110px;
}
</style>
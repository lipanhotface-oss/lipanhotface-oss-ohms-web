<template>
  <div class="script-platform">
    <!-- 可拖拽的左右分割布局 -->
    <div class="resizable-layout">
      <!-- 左侧树状菜单栏（可拖拽调整宽度） -->
      <div
        ref="leftPanel"
        class="left-panel"
        :style="{ width: leftPanelWidth + 'px' }"
      >
        <div class="menu-sidebar">
          <div class="sidebar-header">
            <h3><i class="el-icon-s-platform"></i> 脚本模块</h3>
            <div class="header-actions">
              <el-button
                type="text"
                icon="el-icon-refresh"
                @click="refreshTree"
                size="mini"
              />
              <el-button
                type="text"
                icon="el-icon-search"
                @click="showSearch = !showSearch"
                size="mini"
              />
            </div>
          </div>

          <!-- 搜索框 -->
          <div v-if="showSearch" class="tree-search">
            <el-input
              v-model="treeSearchQuery"
              placeholder="搜索脚本..."
              size="small"
              prefix-icon="el-icon-search"
              clearable
              @input="filterTree"
            />
          </div>

          <el-scrollbar class="tree-scrollbar">
            <el-tree
              ref="treeRef"
              :data="treeMenus"
              :props="treeProps"
              node-key="id"
              show-checkbox
              default-expand-all
              :filter-node-method="filterNode"
              @check-change="handleCheckChange"
              @node-click="handleTreeNodeClick"
            >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span class="tree-node-content">
                  <i :class="data.icon || getNodeIcon(node)"></i>
                  <span class="tree-node-label">{{ data.name }}</span>
                  <el-badge
                    v-if="data.type === 'menu' && getChildrenCount(data) > 0"
                    :value="getChildrenCount(data)"
                    class="tree-node-badge"
                    type="info"
                  />
                </span>
                <span v-if="data.type === 'function'" class="tree-node-actions">
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-view"
                    @click.stop="viewScript(data)"
                  />
                </span>
              </span>
            </el-tree>
          </el-scrollbar>

          <div class="tree-footer">
            <div class="selected-count">
              已选: {{ selectedCount }}
            </div>
            <div class="tree-actions">
              <el-button
                type="text"
                size="mini"
                @click="checkAllNodes"
              >
                全选
              </el-button>
              <el-button
                type="text"
                size="mini"
                @click="uncheckAllNodes"
              >
                清空
              </el-button>
            </div>
          </div>
        </div>

        <!-- 左侧面板拖拽手柄 -->
        <div
          class="resize-handle"
          @mousedown="startResizeLeft"
        ></div>
      </div>

      <!-- 右侧主内容区 -->
      <div class="right-panel">
        <!-- 可拖拽的上下分割布局 -->
        <div class="resizable-vertical">
          <!-- 上方已选择用例区域 -->
          <div
            ref="topPanel"
            class="top-panel"
            :style="{ height: selectedScriptsHeight + 'px' }"
          >
            <el-card class="selected-scripts-card">
              <div slot="header" class="card-header">
                <div class="header-left">
                  <span>已选择测试脚本 ({{ selectedScripts.length }}个)</span>
                  <!-- 执行统计信息 -->
                  <div class="execution-stats-header" v-if="selectedScripts.length > 0">
                    <div class="stat-badges">
                      <el-tag size="mini" type="success">
                        成功: {{ stats.success }}
                      </el-tag>
                      <el-tag size="mini" type="danger">
                        失败: {{ stats.failed }}
                      </el-tag>
                      <el-tag size="mini" type="warning">
                        进行中: {{ stats.processing }}
                      </el-tag>
                      <el-tag size="mini" type="info">
                        成功率: {{ successRate }}%
                      </el-tag>
                      <el-tag size="mini">
                        总耗时: {{ formatTime(stats.totalTime) }}
                      </el-tag>
                    </div>
                    <div class="progress-info">
                      <span v-if="isExecuting">进度: {{ executionProgress }}%</span>
                      <span v-else-if="stats.totalExecutions > 0">
                        已完成: {{ stats.success + stats.failed }}/{{ stats.totalExecutions }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="execution-control">
                <el-form :model="executionConfig" label-width="100px" size="small">
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <el-form-item label="循环次数">
                        <el-input-number
                          v-model="executionConfig.loopCount"
                          :min="1"
                          :max="100"
                          :step="1"
                          controls-position="right"
                          style="width: 100px"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="执行间隔">
                        <el-input-number
                          v-model="executionConfig.interval"
                          :min="1"
                          :max="60"
                          :step="1"
                          controls-position="right"
                          style="width: 100px"
                        />
                        <span style="margin-left: 5px">秒</span>
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="超时时间">
                        <el-input-number
                          v-model="executionConfig.timeout"
                          :min="10"
                          :max="300"
                          :step="10"
                          controls-position="right"
                          style="width: 100px"
                        />
                        <span style="margin-left: 5px">秒</span>
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="并行执行">
                        <el-switch
                          v-model="executionConfig.parallel"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row>
                    <el-col :span="18">
                      <el-form-item label="失败处理">
                        <el-radio-group v-model="executionConfig.failAction">
                          <el-radio label="continue">继续执行</el-radio>
                          <el-radio label="stop">停止执行</el-radio>
                          <el-radio label="skip">跳过该脚本</el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <div class="card-actions">
                        <el-button-group size="mini">
                          <el-button
                            type="primary"
                            icon="el-icon-video-play"
                            @click="executeAll"
                            :loading="executingAll"
                            :disabled="selectedScripts.length === 0"
                          >
                            执行全部
                          </el-button>
                          <el-button
                            type="success"
                            icon="el-icon-download"
                            @click="exportSelected"
                            :disabled="selectedScripts.length === 0"
                          >
                            导出
                          </el-button>
                          <el-button
                            type="danger"
                            icon="el-icon-delete"
                            @click="clearSelected"
                            :disabled="selectedScripts.length === 0"
                          >
                            清空
                          </el-button>
                        </el-button-group>
                      </div>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
              <div class="scripts-table" :style="{ height: selectedScriptsHeight + 'px' }">
                <el-table
                  :data="selectedScripts"
                  style="width: 100%"
                  :height="selectedScriptsHeight - 270"
                  size="small"
                  @row-click="handleRowClick"
                >
                  <el-table-column
                    type="index"
                    label="序号"
                    width="60"
                    align="center"
                  />
                  <el-table-column
                    prop="name"
                    label="脚本名称"
                    width="180"
                  >
                    <template slot-scope="{ row }">
                      <div class="script-name">
                        <i :class="row.icon || 'el-icon-s-promotion'"></i>
                        <span>{{ row.name }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="description"
                    label="描述"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="status"
                    label="状态"
                    width="100"
                    align="center"
                  >
                    <template slot-scope="{ row }">
                      <el-tag
                        size="mini"
                        :type="getStatusType(row.status)"
                        effect="plain"
                      >
                        {{ getStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="progress"
                    label="进度"
                    width="100"
                    align="center"
                  >
                    <template slot-scope="{ row }">
                      <el-progress
                        v-if="row.status === 'processing'"
                        :percentage="row.progress || 0"
                        :show-text="false"
                        :stroke-width="6"
                      />
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="duration"
                    label="耗时"
                    width="80"
                    align="center"
                  >
                    <template slot-scope="{ row }">
                      <span v-if="row.duration">{{ row.duration }}s</span>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="操作"
                    width="150"
                    align="center"
                    fixed="right"
                  >
                    <template slot-scope="{ row, $index }">
                      <el-button-group size="mini">
                        <el-button
                          type="text"
                          icon="el-icon-view"
                          @click.stop="viewScript(row)"
                        />
                        <el-button
                          type="text"
                          icon="el-icon-edit"
                          @click.stop="editScript(row)"
                        />
                        <el-button
                          type="text"
                          :icon="row.status === 'processing' ? 'el-icon-switch-button' : 'el-icon-video-play'"
                          @click.stop="toggleScriptExecution(row)"
                        />
                        <el-button
                          type="text"
                          icon="el-icon-delete"
                          @click.stop="removeScript($index)"
                        />
                      </el-button-group>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
            <!-- 上下分割拖拽手柄 -->
            <div
            class="resize-handle-vertical"
            @mousedown="startResizeTop"/>
          </div>
          <!-- 下方控制台区域 -->
          <div class="bottom-panel">

            <el-card class="console-card">
              <div slot="header" class="card-header">
                <span>执行控制台</span>
                <!-- <div class="card-actions">
                  <el-button-group size="mini">
                    <el-button
                      type="text"
                      icon="el-icon-copy-document"
                      @click="copyConsole"
                    >
                      复制
                    </el-button>
                    <el-button
                      type="text"
                      icon="el-icon-download"
                      @click="downloadConsole"
                    >
                      下载
                    </el-button>
                    <el-button
                      type="text"
                      icon="el-icon-delete"
                      @click="clearConsole"
                    >
                      清空
                    </el-button>
                  </el-button-group>
                </div> -->
              </div>
              <div class="console-content">
                <div class="console-output-area" style="height:250px">
                  <pre
                    style="height:200px"
                    ref="consoleOutput"
                    class="console-output"
                    :class="{ 'executing': isExecuting }"
                  >{{ consoleContent }}1</pre>
                  <div v-if="isExecuting" class="execution-indicator">
                    <div class="execution-info">
                      <i class="el-icon-loading"></i>
                      正在执行 {{ currentExecution }} / {{ totalExecutions }}
                      ({{ currentExecutionName }})
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 脚本详情对话框 -->
    <el-dialog
      :title="currentScript ? currentScript.name : '脚本详情'"
      :visible.sync="showScriptDetail"
      width="800px"
      top="5vh"
    >
      <div v-if="currentScript" class="script-detail">
        <el-tabs v-model="scriptTab">
          <el-tab-pane label="脚本信息" name="info">
            <div class="script-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="脚本名称">{{ currentScript.name }}</el-descriptions-item>
                <el-descriptions-item label="脚本路径">{{ currentScript.script }}</el-descriptions-item>
                <el-descriptions-item label="描述">{{ currentScript.description }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">2024-01-01</el-descriptions-item>
                <el-descriptions-item label="修改时间">2024-01-01</el-descriptions-item>
                <el-descriptions-item label="作者">admin</el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
          <el-tab-pane label="脚本内容" name="content">
            <div class="script-content">
              <codemirror
                v-model="scriptEditorContent"
                :options="editorOptions"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="参数配置" name="parameters">
            <div v-if="currentScript.parameters && currentScript.parameters.length > 0" class="script-parameters">
              <el-form :model="scriptParams" label-width="120px">
                <template v-for="param in currentScript.parameters">
                  <el-form-item
                    :key="param.name"
                    :label="param.label"
                    :required="param.required"
                  >
                    <el-input
                      v-if="param.type === 'string'"
                      v-model="scriptParams[param.name]"
                      :placeholder="param.description"
                    />
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="scriptParams[param.name]"
                      :min="param.min"
                      :max="param.max"
                      :step="param.step || 1"
                    />
                    <el-switch
                      v-else-if="param.type === 'boolean'"
                      v-model="scriptParams[param.name]"
                    />
                    <el-select
                      v-else-if="param.type === 'select'"
                      v-model="scriptParams[param.name]"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="opt in param.options"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </el-form>
            </div>
            <div v-else class="no-parameters">
              此脚本无需参数配置
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showScriptDetail = false">关闭</el-button>
        <el-button type="primary" @click="saveScriptParams">保存参数</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/python/python.js'
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/edit/matchbrackets.js'

export default {
  components: {
    codemirror
  },

  data() {
    return {
      // 左侧面板宽度
      leftPanelWidth: 300,
      isResizingLeft: false,
      startX: 0,
      startWidth: 0,

      // 已选择脚本区域高度
      selectedScriptsHeight: 600,
      isResizingTop: false,
      startY: 0,
      startHeight: 0,

      // 树形菜单
      treeMenus: [],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      treeSearchQuery: '',
      showSearch: false,

      // 选中的脚本
      selectedScripts: [],
      selectedKeys: new Set(),

      // 执行配置
      executionConfig: {
        loopCount: 1,
        interval: 5,
        timeout: 60,
        parallel: false,
        failAction: 'continue'
      },

      // 控制台
      consoleContent: '',
      consoleCommand: '',
      logLevel: 'all',
      isExecuting: false,
      executionProgress: 0,
      currentExecution: 0,
      totalExecutions: 0,
      currentExecutionName: '',

      // 统计信息
      stats: {
        success: 0,
        failed: 0,
        processing: 0,
        totalTime: 0,
        totalExecutions: 0,
        startTime: '',
        endTime: ''
      },

      // 当前脚本
      currentScript: null,
      scriptTab: 'info',
      scriptEditorContent: '',
      scriptParams: {},
      showScriptDetail: false,

      // 编辑器配置
      editorOptions: {
        tabSize: 4,
        theme: 'monokai',
        mode: 'python',
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true
      },

      // 执行状态
      executingAll: false,
      executionQueue: []
    }
  },

  computed: {
    // 选中数量
    selectedCount() {
      return this.selectedKeys.size
    },

    // 计算成功率
    successRate() {
      const total = this.stats.success + this.stats.failed
      if (total === 0) return 0
      return Math.round((this.stats.success / total) * 100)
    }
  },

  mounted() {
    this.initData()
    this.bindResizeEvents()
  },

  beforeDestroy() {
    this.unbindResizeEvents()
  },

  methods: {
    // 初始化数据
    initData() {
      this.treeMenus = this.getTreeData()
      this.loadExecutionConfig()
    },

    // 获取树形数据
    getTreeData() {
      return [
        {
          id: 'group_1',
          name: 'P1',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p1',
              name: 'P1飞行状态',
              icon: 'el-icon-monitor',
              type: 'menu',
              children: [
                {
                  id: 'script_1',
                  name: '飞行状态监控',
                  icon: 'el-icon-s-promotion',
                  type: 'function',
                  data: {
                    name: '飞行状态监控-S001',
                    description: '实时监控飞行状态和参数',
                    script: 'scripts/flight_status.py',
                    status: 'ready',
                    parameters: [
                      {
                        name: 'interval',
                        label: '监控间隔',
                        type: 'number',
                        default: 5,
                        min: 1,
                        max: 60
                      }
                    ]
                  }
                },
                {
                  id: 'script_2',
                  name: '飞机事件S001',
                  icon: 'el-icon-fan',
                  type: 'function',
                  data: {
                    name: '飞机事件S001',
                    description: '监控发动机运行状态',
                    script: 'scripts/engine_monitor.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'group_2',
          name: 'P2',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p2',
              name: 'P2通信测试',
              icon: 'el-icon-cpu',
              type: 'menu',
              children: [
                {
                  id: 'script_2-1',
                  name: 'P2通信测试',
                  icon: 'el-icon-s-operation',
                  type: 'function',
                  data: {
                    name: 'P2通信测试',
                    description: '数据处理和分析脚本',
                    script: 'scripts/data_processing.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'group_3',
          name: 'P3',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p3-1',
              name: 'P3故障诊断',
              icon: 'el-icon-s-opportunity',
              type: 'menu',
              children: [
                {
                  id: 'script_5',
                  name: '故障诊断S001',
                  icon: 'el-icon-s-claim',
                  type: 'function',
                  data: {
                    name: '故障诊断S001',
                    description: '自动化单元测试脚本',
                    script: 'scripts/unit_test.py',
                    status: 'ready'
                  }
                }
              ]
            },
            {
              id: 'p3-2',
              name: 'P3维护模式',
              icon: 'el-icon-s-flag',
              type: 'menu',
              children: [
                {
                  id: 'script_6',
                  name: '维护模式S001',
                  icon: 'el-icon-s-marketing',
                  type: 'function',
                  data: {
                    name: '维护模式S001',
                    description: '系统集成测试脚本',
                    script: 'scripts/integration_test.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'group_4',
          name: 'P4',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p4',
              name: 'P4构型管理',
              icon: 'el-icon-cpu',
              type: 'menu',
              children: [
                {
                  id: 'script_4-1',
                  name: '构型管理S001',
                  icon: 'el-icon-s-operation',
                  type: 'function',
                  data: {
                    name: '构型管理S001',
                    description: '构型管理S001',
                    script: 'scripts/data_processing.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    // 获取子节点数量
    getChildrenCount(node) {
      if (!node.children) return 0
      return node.children.filter(child => child.type === 'function').length
    },

    // 获取节点图标
    getNodeIcon(node) {
      if (node.type === 'group') return 'el-icon-folder'
      if (node.type === 'menu') return 'el-icon-folder-opened'
      return 'el-icon-document'
    },

    // 树节点过滤
    filterNode(value, data, node) {
      if (!value) return true
      return data.name.toLowerCase().includes(value.toLowerCase())
    },

    // 过滤树
    filterTree() {
      this.$refs.treeRef.filter(this.treeSearchQuery)
    },

    // 刷新树
    refreshTree() {
      this.$message.success('树结构已刷新')
    },

    // 树节点勾选变化
    handleCheckChange(node, checked, indeterminate) {
      if (node.type === 'function') {
        if (checked) {
          this.selectedKeys.add(node.id)
          this.addScript(node)
        } else {
          this.selectedKeys.delete(node.id)
          this.removeScriptById(node.id)
        }
      }
    },

    // 树节点点击
    handleTreeNodeClick(node) {
      if (node.type === 'function') {
        // 勾选/取消勾选该节点
        this.$refs.treeRef.setChecked(node, !this.selectedKeys.has(node.id))
      }
    },

    // 添加脚本到已选择列表
    addScript(node) {
      const existing = this.selectedScripts.find(s => s.id === node.id)
      if (!existing) {
        this.selectedScripts.push({
          id: node.id,
          ...node.data,
          status: 'ready',
          progress: 0,
          duration: null
        })
      }
    },

    // 根据ID移除脚本
    removeScriptById(id) {
      const index = this.selectedScripts.findIndex(s => s.id === id)
      if (index !== -1) {
        this.selectedScripts.splice(index, 1)
      }
    },

    // 从表格中移除脚本
    removeScript(index) {
      const script = this.selectedScripts[index]
      if (script) {
        this.selectedKeys.delete(script.id)
        this.$refs.treeRef.setChecked(script.id, false)
        this.selectedScripts.splice(index, 1)
      }
    },

    // 全选节点
    checkAllNodes() {
      const getAllFunctionNodes = (nodes) => {
        let functionNodes = []
        for (const node of nodes) {
          if (node.type === 'function') {
            functionNodes.push(node)
          }
          if (node.children) {
            functionNodes = [...functionNodes, ...getAllFunctionNodes(node.children)]
          }
        }
        return functionNodes
      }

      const functionNodes = getAllFunctionNodes(this.treeMenus)
      const nodeIds = functionNodes.map(node => node.id)
      this.$refs.treeRef.setCheckedKeys(nodeIds)
    },

    // 清空所有选择
    uncheckAllNodes() {
      this.$refs.treeRef.setCheckedKeys([])
    },

    // 执行所有脚本
    async executeAll() {
      if (this.selectedScripts.length === 0) {
        this.$message.warning('请先选择要执行的脚本')
        return
      }

      this.executingAll = true
      this.isExecuting = true
      this.stats = {
        success: 0,
        failed: 0,
        processing: this.selectedScripts.length,
        totalTime: 0,
        totalExecutions: this.selectedScripts.length * this.executionConfig.loopCount,
        startTime: new Date().toLocaleTimeString(),
        endTime: ''
      }

      this.totalExecutions = this.selectedScripts.length * this.executionConfig.loopCount
      this.currentExecution = 0
      this.executionProgress = 0

      this.logToConsole('开始执行脚本...')
      this.logToConsole(`执行配置: 循环 ${this.executionConfig.loopCount} 次, 间隔 ${this.executionConfig.interval} 秒`)

      try {
        for (let loop = 0; loop < this.executionConfig.loopCount; loop++) {
          if (!this.isExecuting) break

          if (this.executionConfig.parallel) {
            await this.executeParallel(loop)
          } else {
            await this.executeSequential(loop)
          }
        }

        this.stats.endTime = new Date().toLocaleTimeString()
        this.logToConsole('执行完成!')
        this.logToConsole(`统计: 成功 ${this.stats.success}, 失败 ${this.stats.failed}, 成功率 ${this.successRate}%`)

      } catch (error) {
        this.logToConsole(`执行出错: ${error.message}`)
      } finally {
        this.executingAll = false
        this.isExecuting = false
        this.stats.processing = 0
      }
    },

    // 顺序执行
    async executeSequential(loopIndex) {
      for (let i = 0; i < this.selectedScripts.length; i++) {
        if (!this.isExecuting) break

        const script = this.selectedScripts[i]
        this.currentExecutionName = script.name
        await this.executeSingleScript(script, loopIndex + 1)
        this.currentExecution++
        this.executionProgress = Math.round((this.currentExecution / this.totalExecutions) * 100)

        if (i < this.selectedScripts.length - 1 || loopIndex < this.executionConfig.loopCount - 1) {
          await this.sleep(this.executionConfig.interval * 1000)
        }
      }
    },

    // 并行执行
    async executeParallel(loopIndex) {
      this.currentExecutionName = '多个脚本并行执行'
      const promises = this.selectedScripts.map(script =>
        this.executeSingleScript(script, loopIndex + 1)
      )
      await Promise.all(promises)
      this.currentExecution += this.selectedScripts.length
      this.executionProgress = Math.round((this.currentExecution / this.totalExecutions) * 100)

      if (loopIndex < this.executionConfig.loopCount - 1) {
        await this.sleep(this.executionConfig.interval * 1000)
      }
    },

    // 执行单个脚本
    async executeSingleScript(script, loopIndex) {
      try {
        this.updateScriptStatus(script.id, 'processing', 0)
        this.logToConsole(`开始执行: ${script.name} (第${loopIndex}次循环)`)

        const startTime = Date.now()

        // 模拟执行进度
        const updateProgress = async () => {
          for (let progress = 0; progress <= 100; progress += 20) {
            if (script.status !== 'processing') break
            this.updateScriptProgress(script.id, progress)
            await this.sleep(200)
          }
        }

        await Promise.all([
          updateProgress(),
          this.sleep(1000 + Math.random() * 2000) // 模拟执行时间
        ])

        const duration = Math.round((Date.now() - startTime) / 1000)
        const success = Math.random() > 0.3 // 70%成功率

        if (success) {
          this.updateScriptStatus(script.id, 'success', 100)
          this.updateScriptDuration(script.id, duration)
          this.stats.success++
          this.logToConsole(`✓ ${script.name} 执行成功 (耗时: ${duration}s)`)
        } else {
          this.updateScriptStatus(script.id, 'failed', 100)
          this.stats.failed++
          this.logToConsole(`✗ ${script.name} 执行失败`)

          if (this.executionConfig.failAction === 'stop') {
            throw new Error(`${script.name} 执行失败，停止执行`)
          }
        }

        this.stats.processing--
        this.stats.totalTime += duration

      } catch (error) {
        this.updateScriptStatus(script.id, 'failed', 100)
        this.stats.failed++
        this.stats.processing--
        this.logToConsole(`✗ ${script.name} 执行出错: ${error.message}`)

        if (this.executionConfig.failAction === 'stop') {
          throw error
        }
      }
    },

    // 切换单个脚本执行状态
    toggleScriptExecution(script) {
      if (script.status === 'processing') {
        this.stopScriptExecution(script)
      } else {
        this.executeSingleScript(script, 1)
      }
    },

    // 停止脚本执行
    stopScriptExecution(script) {
      this.updateScriptStatus(script.id, 'stopped', 0)
      this.logToConsole(`! ${script.name} 执行已停止`)
    },

    // 更新脚本状态
    updateScriptStatus(id, status, progress) {
      const script = this.selectedScripts.find(s => s.id === id)
      if (script) {
        script.status = status
        script.progress = progress
      }
    },

    // 更新脚本进度
    updateScriptProgress(id, progress) {
      const script = this.selectedScripts.find(s => s.id === id)
      if (script && script.status === 'processing') {
        script.progress = progress
      }
    },

    // 更新脚本耗时
    updateScriptDuration(id, duration) {
      const script = this.selectedScripts.find(s => s.id === id)
      if (script) {
        script.duration = duration
      }
    },

    // 表格行点击
    handleRowClick(row) {
      this.viewScript(row)
    },

    // 查看脚本
    viewScript(script) {
      this.currentScript = { ...script }
      this.scriptTab = 'info'
      this.scriptEditorContent = `# ${script.name}\n# ${script.description}\n\nprint("Hello from ${script.name}")`
      this.scriptParams = {}

      if (script.parameters) {
        script.parameters.forEach(param => {
          this.scriptParams[param.name] = param.default || ''
        })
      }

      this.showScriptDetail = true
    },

    // 编辑脚本
    editScript(script) {
      this.viewScript(script)
      this.scriptTab = 'content'
    },

    // 保存脚本参数
    saveScriptParams() {
      this.$message.success('参数已保存')
      this.showScriptDetail = false
    },

    // 导出选择的脚本
    exportSelected() {
      const data = JSON.stringify(this.selectedScripts, null, 2)
      this.downloadFile(data, `scripts_${new Date().getTime()}.json`)
      this.$message.success(`已导出 ${this.selectedScripts.length} 个脚本`)
    },

    // 清空选择的脚本
    clearSelected() {
      this.selectedScripts = []
      this.selectedKeys.clear()
      this.stats = {
        success: 0,
        failed: 0,
        processing: 0,
        totalTime: 0,
        totalExecutions: 0,
        startTime: '',
        endTime: ''
      }
      this.$refs.treeRef.setCheckedKeys([])
    },

    // 复制控制台内容
    copyConsole() {
      navigator.clipboard.writeText(this.consoleContent)
        .then(() => this.$message.success('控制台内容已复制'))
        .catch(() => this.$message.error('复制失败'))
    },

    // 下载控制台日志
    downloadConsole() {
      this.downloadFile(this.consoleContent, `console_${new Date().getTime()}.log`)
      this.$message.success('日志已下载')
    },

    // 清空控制台
    clearConsole() {
      this.consoleContent = ''
      this.$message.success('控制台已清空')
    },

    // 执行控制台命令
    executeConsoleCommand() {
      const command = this.consoleCommand.trim()
      if (!command) return

      this.logToConsole(`> ${command}`)

      switch (command.toLowerCase()) {
        case 'help':
          this.logToConsole('可用命令: clear, stats, stop, help')
          break
        case 'clear':
          this.clearConsole()
          break
        case 'stats':
          this.logToConsole(`统计: 成功 ${this.stats.success}, 失败 ${this.stats.failed}, 进行中 ${this.stats.processing}, 成功率 ${this.successRate}%`)
          break
        case 'stop':
          if (this.isExecuting) {
            this.isExecuting = false
            this.logToConsole('执行已停止')
          }
          break
        default:
          this.logToConsole(`未知命令: ${command}`)
      }

      this.consoleCommand = ''
    },

    // 记录到控制台
    logToConsole(message) {
      const timestamp = new Date().toLocaleTimeString()
      this.consoleContent += `[${timestamp}] ${message}\n`
      this.$nextTick(() => {
        if (this.$refs.consoleOutput) {
          this.$refs.consoleOutput.scrollTop = this.$refs.consoleOutput.scrollHeight
        }
      })
    },

    // 获取状态类型
    getStatusType(status) {
      const types = {
        'ready': 'info',
        'processing': 'warning',
        'success': 'success',
        'failed': 'danger',
        'stopped': 'info'
      }
      return types[status] || 'info'
    },

    // 获取状态文本
    getStatusText(status) {
      const texts = {
        'ready': '就绪',
        'processing': '执行中',
        'success': '成功',
        'failed': '失败',
        'stopped': '已停止'
      }
      return texts[status] || '就绪'
    },

    // 格式化时间
    formatTime(seconds) {
      if (!seconds) return '0s'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      if (hours > 0) return `${hours}h ${minutes}m`
      if (minutes > 0) return `${minutes}m ${secs}s`
      return `${secs}s`
    },

    // 加载执行配置
    loadExecutionConfig() {
      const saved = localStorage.getItem('execution_config')
      if (saved) {
        this.executionConfig = { ...this.executionConfig, ...JSON.parse(saved) }
      }
    },

    // 保存执行配置
    saveExecutionConfig() {
      localStorage.setItem('execution_config', JSON.stringify(this.executionConfig))
    },

    // 睡眠函数
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    // 下载文件
    downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    // 拖拽相关方法
    bindResizeEvents() {
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
    },

    unbindResizeEvents() {
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
    },

    // 开始调整左侧面板宽度
    startResizeLeft(event) {
      this.isResizingLeft = true
      this.startX = event.clientX
      this.startWidth = this.leftPanelWidth
      event.preventDefault()
    },

    // 开始调整已选择脚本区域高度
    startResizeTop(event) {
      this.isResizingTop = true
      this.startY = event.clientY
      this.startHeight = this.selectedScriptsHeight
      event.preventDefault()
    },

    // 处理鼠标移动
    handleMouseMove(event) {
      if (this.isResizingLeft) {
        const deltaX = event.clientX - this.startX
        const newWidth = Math.max(200, Math.min(500, this.startWidth + deltaX))
        this.leftPanelWidth = newWidth
      }

      if (this.isResizingTop) {
        const deltaY = event.clientY - this.startY
        const newHeight = Math.max(200, Math.min(window.innerHeight - 200, this.startHeight + deltaY))
        this.selectedScriptsHeight = newHeight
      }
    },

    // 处理鼠标释放
    handleMouseUp() {
      this.isResizingLeft = false
      this.isResizingTop = false
    }
  }
}
</script>

<style scoped>
.script-platform {
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.resizable-layout {
  display: flex;
  height: 100%;
  position: relative;
}

.left-panel {
  position: relative;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #dcdfe6;
  transition: none;
  user-select: none;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
}
.resize-handle-vertical {
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0%;
  height: 6px;
  background: transparent;
  cursor: row-resize;
  z-index: 10;
}
.resize-handle:hover {
  background: rgba(64, 158, 255, 0.1);
}

.resize-handle:active {
  background: rgba(64, 158, 255, 0.2);
}

.resize-handle.vertical {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 6px;
  cursor: row-resize;
  width: auto;
}

.menu-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 5px;
}

.tree-search {
  padding: 10px 15px;
  border-bottom: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.tree-scrollbar {
  flex: 1;
  overflow: hidden;
}

.tree-scrollbar >>> .el-scrollbar__wrap {
  overflow-x: hidden;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding-right: 8px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.tree-node-content i {
  width: 16px;
  text-align: center;
  color: #606266;
}

.tree-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-badge {
  margin-left: 8px;
}

.tree-node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-tree-node:hover .tree-node-actions {
  opacity: 1;
}

.tree-footer {
  padding: 10px 15px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #fafafa;
}

.selected-count {
  font-size: 12px;
  color: #909399;
}

.tree-actions {
  display: flex;
  gap: 8px;
}

.resizable-vertical {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.top-panel {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.bottom-panel {
  flex: 1;
  overflow: hidden;
  padding-top: 3px;
}

.selected-scripts-card,
.console-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  height: 60px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 10px !important;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  flex-shrink: 0;
  flex-direction: column;
  gap: 10px;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* .card-header span {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
} */

.execution-stats-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

.stat-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.progress-info {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.card-actions {
  margin-left: auto;
}

.execution-control {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.scripts-table {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.scripts-table >>> .el-table__body-wrapper {
  height: calc(100% - 40px);
  overflow: auto;
}

.script-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.script-name i {
  color: #409eff;
}

.console-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.console-toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
  background: #fafafa;
}

.console-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.console-output-area {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  background: #1e1e1e;
  position: relative;
}

.console-output {
  margin: 0;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.console-output.executing {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(64, 158, 255, 0.05) 100%
  );
}

.execution-indicator {
  position: absolute;
  bottom: 10px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(30, 30, 30, 0.9);
  padding: 8px 15px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.execution-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #409eff;
  font-size: 12px;
}

.console-input-area {
  padding: 10px 20px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
  background: #fafafa;
}

.script-detail {
  height: 500px;
  overflow: hidden;
}

.script-info {
  padding: 20px;
}

.script-content {
  height: 400px;
  overflow: hidden;
}

.script-parameters {
  padding: 20px;
}

.no-parameters {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}

.el-tree >>> .el-tree-node__content {
  height: 32px;
}

.el-tree >>> .el-tree-node.is-checked > .el-tree-node__content {
  background-color: #ecf5ff;
}

.el-tree >>> .el-tree-node__expand-icon.is-leaf {
  color: transparent;
  cursor: default;
}

/* 滚动条样式 */
.console-output::-webkit-scrollbar {
  width: 8px;
}

.console-output::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.console-output::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-output::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>

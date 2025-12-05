<template>
  <div class="menu-config-simple">
    <!-- 头部操作栏 -->
    <div class="config-header">
      <div class="header-left">
        <h2><i class="el-icon-setting" /> 菜单配置管理</h2>
        <p class="header-desc">配置左侧导航菜单结构，配置后立即生效</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          icon="el-icon-download"
          size="small"
          @click="exportConfig"
        >
          导出配置
        </el-button>
        <el-button
          type="success"
          icon="el-icon-upload"
          size="small"
          @click="showImport = true"
        >
          导入配置
        </el-button>
        <el-button
          type="info"
          icon="el-icon-upload"
          size="small"
          :loading="uploadingRequirements"
          @click="openRequirementUploadDialog"
        >
          导入需求
        </el-button>
        <!-- <el-button
          type="warning"
          icon="el-icon-refresh"
          size="small"
          @click="resetToDefault"
        >
          重置
        </el-button> -->
        <el-button
          type="primary"
          icon="el-icon-check"
          size="small"
          :loading="saving"
          :disabled="!hasUnsavedChanges && !scriptUploadSuccess"
          @click="saveConfig"
        >
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="config-main">
      <!-- 左侧：菜单树 -->
      <div class="left-section" :style="{ width: leftWidth + 'px' }">
        <el-card shadow="never">
          <div slot="header" class="section-header">
            <span>菜单结构</span>
            <div class="section-actions">
              <el-button
                type="text"
                icon="el-icon-plus"
                size="mini"
                @click="addGroup"
              >
                添加分组
              </el-button>
              <el-button
                type="text"
                icon="el-icon-sort"
                size="mini"
                @click="toggleExpand"
              >
                {{ isExpanded ? '收起全部' : '展开全部' }}
              </el-button>
            </div>
          </div>

          <div class="tree-search" style="padding: 10px; border-bottom: 1px solid #dcdfe6;">
            <el-input
              v-model="searchText"
              placeholder="搜索菜单..."
              prefix-icon="el-icon-search"
              size="small"
              clearable
            />
          </div>

          <el-scrollbar class="tree-scrollbar">
            <el-tree
              ref="menuTree"
              :data="menuData"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              draggable
              @node-click="handleNodeClick"
              @node-drop="handleDrop"
            >
              <div slot-scope="{ node, data }" class="tree-node">
                <div class="node-content">
                  <i :class="getNodeIcon(data.type)" class="node-icon" />
                  <span class="node-label">{{ data.name }}</span>
                  <el-tag
                    v-if="data.type === 'script'"
                    size="mini"
                    type="info"
                    class="script-tag"
                  >
                    脚本
                  </el-tag>
                </div>
                <div class="node-actions">
                  <el-button
                    v-if="data.type !== 'script'"
                    type="text"
                    icon="el-icon-plus"
                    size="mini"
                    title="添加子项"
                    @click.stop="addChild(node, data)"
                  />
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    size="mini"
                    title="编辑"
                    @click.stop="editNode(data)"
                  />
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    size="mini"
                    title="删除"
                    style="color: #F56C6C;"
                    @click.stop="deleteNode(node, data)"
                  />
                </div>
              </div>
            </el-tree>
          </el-scrollbar>

          <div class="tree-stats">
            <el-row :gutter="10">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">分组</div>
                  <div class="stat-value">{{ stats.groups }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">菜单</div>
                  <div class="stat-value">{{ stats.menus }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">脚本</div>
                  <div class="stat-value">{{ stats.scripts }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">总计</div>
                  <div class="stat-value">{{ stats.total }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 可拖动分隔条 -->
      <div class="splitter" @mousedown="startDrag" @touchstart.prevent="startDragTouch" />

      <!-- 右侧：配置表单 -->
      <div class="right-section">
        <el-card shadow="never">
          <div slot="header" class="section-header">
            <span>节点配置</span>
            <div v-if="currentNode" class="node-status">
              <el-tag size="small" :type="getNodeTypeTag(currentNode.type)">
                {{ getNodeTypeName(currentNode.type) }}
              </el-tag>
            </div>
          </div>

          <div v-if="currentNode" class="form-container">
            <el-form
              ref="configForm"
              :model="currentNode"
              :rules="formRules"
              label-width="80px"
              size="small"
            >
              <!-- 基础信息 -->
              <el-form-item label="名称" prop="name">
                <el-input
                  v-model="currentNode.name"
                  placeholder="请输入名称"
                  maxlength="20"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="类型">
                <div style="display:flex; align-items:center; gap:8px;">
                  <el-tag size="small" :type="getNodeTypeTag(currentNode.type)">
                    {{ getNodeTypeName(currentNode.type) }}
                  </el-tag>
                  <el-input v-model="currentNode.type" disabled size="small" style="width:120px;" />
                </div>
              </el-form-item>

              <el-form-item label="图标">
                <el-select
                  v-model="currentNode.icon"
                  placeholder="选择图标"
                  style="width: 100%;"
                >
                  <el-option-group label="常用图标">
                    <el-option
                      v-for="icon in iconOptions"
                      :key="icon.value"
                      :label="icon.label"
                      :value="icon.value"
                    >
                      <span style="float: left">
                        <i :class="icon.value" />
                      </span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        {{ icon.label }}
                      </span>
                    </el-option>
                  </el-option-group>
                </el-select>
              </el-form-item>

              <!-- 脚本特有配置 -->
              <template v-if="currentNode.type === 'script'">
                <el-form-item label="脚本文件">
                  <el-input
                    v-model="currentNode.scriptFile"
                    placeholder="脚本文件路径，如: scripts/test.js"
                  >
                    <el-button
                      slot="append"
                      icon="el-icon-folder"
                      @click="browseScript"
                    />
                  </el-input>
                </el-form-item>

                <el-form-item label="描述">
                  <el-input
                    v-model="currentNode.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入脚本描述"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="需求信息">
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    <div>
                      <el-tag
                        v-for="req in currentNode.requirement_number"
                        :key="req.id"
                        closable
                        type="info"
                        style="margin-right:6px;"
                        @close="removeRequirementFromNode(currentNode, req.id)"
                      >
                        {{ req.number }} - {{ req.name }}
                      </el-tag>
                      <span v-if="!currentNode.requirement_number || currentNode.requirement_number.length === 0" style="color:#909399">未配置需求</span>
                    </div>

                    <div style="display:flex; gap:8px; align-items:center;">
                      <el-select
                        v-model="currentNode._selectedRequirementIds"
                        placeholder="多选需求并添加"
                        size="small"
                        style="min-width:240px;"
                        multiple
                        clearable
                        @change="addRequirementToNode(currentNode, $event)"
                      >
                        <el-option
                          v-for="r in requirementList"
                          :key="r.number"
                          :label="r.number + ' - ' + r.name"
                          :value="r.number"
                        />
                      </el-select>
                      <el-button type="text" size="small" @click="currentNode._selectedRequirementIds = []">清除选择</el-button>
                    </div>
                  </div>
                </el-form-item>

                <el-form-item label="参数">
                  <div class="params-container">
                    <div v-for="(param, index) in currentNode.params" :key="index" class="param-item">
                      <el-input
                        v-model="param.name"
                        placeholder="参数名"
                        size="mini"
                        style="width: 120px; margin-right: 5px;"
                      />
                      <el-input
                        v-model="param.defaultValue"
                        placeholder="默认值"
                        size="mini"
                        style="width: 120px; margin-right: 5px;"
                      />
                      <el-button
                        type="text"
                        icon="el-icon-delete"
                        size="mini"
                        style="color: #F56C6C;"
                        @click="removeParam(index)"
                      />
                    </div>
                    <el-button
                      type="text"
                      icon="el-icon-plus"
                      size="mini"
                      @click="addParam"
                    >
                      添加参数
                    </el-button>
                  </div>
                </el-form-item>
              </template>

              <!-- 通用配置 -->
              <el-form-item label="顺序">
                <el-input-number
                  v-model="currentNode.order"
                  :min="1"
                  :max="100"
                  controls-position="right"
                  style="width: 100px;"
                />
              </el-form-item>

              <el-form-item label="状态">
                <el-switch
                  v-model="currentNode.enabled"
                  active-text="启用"
                  inactive-text="禁用"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                />
              </el-form-item>
            </el-form>
          </div>

          <div v-else class="no-selection">
            <div class="empty-tip">
              <i class="el-icon-info" style="font-size: 48px; color: #C0C4CC;" />
              <p>请选择一个节点进行配置</p>
              <small>或点击左侧的"添加分组"按钮</small>
            </div>
          </div>
        </el-card>

        <!-- 预览 -->
        <el-card shadow="never" class="preview-card">
          <div slot="header" class="section-header">
            <span>预览</span>
            <el-button
              type="text"
              icon="el-icon-view"
              size="mini"
              @click="refreshPreview"
            >
              刷新
            </el-button>
          </div>
          <div class="preview-content">
            <div class="preview-tree">
              <div v-for="group in menuData" :key="group.id" class="preview-group">
                <div class="preview-group-title">
                  <i :class="group.icon || 'el-icon-folder'" />
                  {{ group.name }}
                  <el-tag v-if="!group.enabled" size="mini" type="info">禁用</el-tag>
                </div>
                <div v-if="group.children" class="preview-children">
                  <div v-for="menu in group.children" :key="menu.id" class="preview-menu">
                    <div class="preview-menu-title">
                      <i :class="menu.icon || 'el-icon-folder-opened'" />
                      {{ menu.name }}
                    </div>
                    <div v-if="menu.children" class="preview-scripts">
                      <div v-for="script in menu.children" :key="script.id" class="preview-script">
                        <i :class="script.icon || 'el-icon-document'" />
                        {{ script.name }}
                        <span v-if="script.scriptFile" class="script-file">
                          ({{ script.scriptFile }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 导入对话框 -->
    <el-dialog
      title="导入配置"
      :visible.sync="showImport"
      width="400px"
    >
      <div class="import-content">
        <el-upload
          class="config-upload"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileUpload"
          accept=".json"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">
            将JSON配置文件拖到此处
            <br>
            或 <em>点击上传</em>
          </div>
        </el-upload>
        <div class="import-tips">
          <p><i class="el-icon-warning" /> 导入会覆盖当前配置</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确定导入</el-button>
      </span>
    </el-dialog>

    <!-- 脚本上传/编辑对话框 -->
    <el-dialog
      title="上传/编辑脚本"
      :visible.sync="showScriptDialog"
      width="70%"
    >
      <div class="script-upload-dialog">
        <div class="script-dialog-tips">
          <p><i class="el-icon-info" /> 选择已上传脚本将直接绑定；上传新脚本需点确定</p>
        </div>
        <div style="margin-bottom: 10px; display:flex; align-items:center; gap:10px;">
          <el-button type="primary" size="mini" @click="$refs.scriptFileInput.click()">选择 .py 文件</el-button>
          <el-button type="success" :loading="loadingServerScripts" size="mini" @click="openServerScriptList">选择已上传脚本</el-button>
          <div style="color:#606266">{{ scriptFileName || '未选择文件' }}</div>
        </div>
        <input ref="scriptFileInput" type="file" accept=".py" style="display:none" @change="onScriptFileChange">

        <el-input v-model="scriptContent" type="textarea" :rows="18" placeholder="脚本内容将在此显示，可直接编辑后上传" />
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="showScriptDialog = false">取消</el-button>
        <el-button :loading="uploadingScript" :disabled="!scriptFileName && !scriptContent" type="primary" @click="uploadScriptToServer">上传</el-button>
        <el-button :disabled="!scriptUploadSuccess" type="success" @click="confirmScriptBinding">确定绑定</el-button>
      </span>
    </el-dialog>

    <!-- 服务器脚本列表对话框 -->
    <el-dialog
      title="选择已上传的脚本"
      :visible.sync="showServerScriptDialog"
      width="60%"
    >
      <el-table v-loading="loadingServerScripts" :data="serverScriptList" style="width: 100%">
        <el-table-column prop="name" label="脚本名称" width="200" />
        <el-table-column prop="path" label="脚本路径" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="selectServerScript(scope.row.path)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showServerScriptDialog = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 需求上传对话框 -->
    <el-dialog
      title="导入需求信息"
      :visible.sync="showRequirementUploadDialog"
      width="500px"
    >
      <div class="requirement-upload-dialog">
        <div class="requirement-dialog-tips">
          <p><i class="el-icon-info" /> 上传 Excel 文件（.xlsx 或 .xls），包含需求 ID、编号、名称、描述等字段</p>
        </div>
        <el-upload
          class="requirement-upload"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleRequirementFileChange"
          accept=".xlsx,.xls"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">
            将 Excel 文件拖到此处
            <br>
            或 <em>点击上传</em>
          </div>
        </el-upload>

        <div v-if="requirementPreview && requirementPreview.length" style="margin-top:12px;">
          <div style="margin-bottom:8px; font-weight:500">解析预览（共 {{ requirementPreview.length }} 条）</div>
          <div class="requirement-preview-container" style="max-height:300px; overflow:auto; border:1px solid #e6e6e6; padding:6px; border-radius:4px; background:#fff">
            <el-table :data="requirementPreview" size="small" style="width:100%">
              <el-table-column v-for="(h, idx) in requirementPreviewHeaders" :key="'col_'+idx" :prop="h" :label="h" />
            </el-table>
          </div>
          <div style="margin-top:8px; color:#909399; font-size:12px">
            <span v-if="!requirementPreviewValid" style="color:#f56c6c">表格缺少必需表头：ID、需求名称、备注。请检查列名后重试。</span>
            <span v-else>表头检测通过，可点击“上传并保存”提交。</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeRequirementUploadDialog">取消</el-button>
        <el-button :loading="uploadingRequirements" :disabled="!requirementFile || !requirementPreviewValid" type="primary" @click="uploadRequirements">上传并保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { uploadScript, getScriptList, saveMenuConfig, getMenuConfig, getRequirementList, saveRequirementList } from '@/api/script'
import XLSX from 'xlsx'

export default {
  name: 'SimpleMenuConfig',

  data() {
    return {
      // 左侧宽度（像素），支持持久化
      leftWidth: Number(localStorage.getItem('menu_left_width')) || 300,
      dragging: false,
      dragStartX: 0,
      dragStartWidth: 0,

      // 菜单数据
      menuData: [],
      currentNode: null,
      originalData: null,

      // UI状态
      isExpanded: true,
      searchText: '',
      showImport: false,
      // 脚本上传/编辑对话框
      showScriptDialog: false,
      scriptFileName: '',
      scriptContent: '',
      scriptFileRaw: null,
      uploadingScript: false,
      scriptNodeRef: null,
      scriptUploadSuccess: false, // 标记脚本是否上传成功
      uploadedScriptPath: '', // 临时存储上传后的脚本路径
      hasUnsavedChanges: false, // 标记是否有未保存的配置
      saving: false, // 标记是否正在保存配置
      showServerScriptDialog: false, // 服务器脚本列表对话框
      serverScriptList: [], // 服务器上的脚本列表
      loadingServerScripts: false,

      // 需求数据（从后端接口获取）
      requirementList: [],
      loadingRequirements: false,
      showRequirementUploadDialog: false, // 需求上传对话框
      requirementFile: null, // 上传的 xlsx 文件
      requirementPreview: [], // 解析后的预览数据 (未发送)
      requirementPreviewHeaders: [], // 解析表格的实际表头（用于预览列）
      requirementPreviewValid: false, // 预览表头是否包含必需字段
      uploadingRequirements: false,

      // 图标选项
      iconOptions: [
        { value: 'el-icon-s-data', label: '数据' },
        { value: 'el-icon-s-platform', label: '平台' },
        { value: 'el-icon-monitor', label: '监控' },
        { value: 'el-icon-cpu', label: 'CPU' },
        { value: 'el-icon-s-opportunity', label: '机会' },
        { value: 'el-icon-s-flag', label: '标记' },
        { value: 'el-icon-s-marketing', label: '营销' },
        { value: 'el-icon-s-operation', label: '操作' },
        { value: 'el-icon-s-promotion', label: '推广' },
        { value: 'el-icon-s-claim', label: '声明' },
        { value: 'el-icon-folder', label: '文件夹' },
        { value: 'el-icon-folder-opened', label: '打开文件夹' },
        { value: 'el-icon-document', label: '文档' },
        { value: 'el-icon-tickets', label: '票据' },
        { value: 'el-icon-collection', label: '收藏' }
      ],

      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
          { min: 2, message: '至少2个字符', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ]
      },

      // 默认数据
      defaultData: [
        {
          id: 'g1',
          name: 'P1 - 基础功能',
          type: 'group',
          icon: 'el-icon-s-data',
          order: 1,
          enabled: true,
          children: [
            {
              id: 'm1',
              name: '飞行状态监控',
              type: 'menu',
              icon: 'el-icon-monitor',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's1',
                  name: '状态监控脚本',
                  type: 'script',
                  icon: 'el-icon-s-promotion',
                  scriptFile: 'scripts/flight_status.py',
                  description: '监控飞行器的实时状态',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'interval', defaultValue: '5' },
                    { name: 'timeout', defaultValue: '30' }
                  ]
                },
                {
                  id: 's2',
                  name: '发动机监控',
                  type: 'script',
                  icon: 'el-icon-fan',
                  scriptFile: 'scripts/engine_monitor.py',
                  description: '监控发动机运行状态',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            }
          ]
        },
        {
          id: 'g2',
          name: 'P2 - 通信测试',
          type: 'group',
          icon: 'el-icon-s-platform',
          order: 2,
          enabled: true,
          children: [
            {
              id: 'm2',
              name: '通信协议测试',
              type: 'menu',
              icon: 'el-icon-cpu',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's3',
                  name: 'TCP通信测试',
                  type: 'script',
                  icon: 'el-icon-s-operation',
                  scriptFile: 'scripts/tcp_test.py',
                  description: '测试TCP通信连接',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'host', defaultValue: '127.0.0.1' },
                    { name: 'port', defaultValue: '8080' }
                  ]
                },
                {
                  id: 's4',
                  name: 'UDP通信测试',
                  type: 'script',
                  icon: 'el-icon-s-operation',
                  scriptFile: 'scripts/udp_test.py',
                  description: '测试UDP通信连接',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            }
          ]
        },
        {
          id: 'g3',
          name: 'P3 - 故障诊断',
          type: 'group',
          icon: 'el-icon-s-opportunity',
          order: 3,
          enabled: true,
          children: [
            {
              id: 'm3',
              name: '系统诊断',
              type: 'menu',
              icon: 'el-icon-s-flag',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's5',
                  name: '内存诊断',
                  type: 'script',
                  icon: 'el-icon-s-claim',
                  scriptFile: 'scripts/memory_diagnose.py',
                  description: '诊断系统内存使用情况',
                  order: 1,
                  enabled: true,
                  params: []
                },
                {
                  id: 's6',
                  name: 'CPU诊断',
                  type: 'script',
                  icon: 'el-icon-s-marketing',
                  scriptFile: 'scripts/cpu_diagnose.py',
                  description: '诊断CPU使用情况',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            },
            {
              id: 'm4',
              name: '网络诊断',
              type: 'menu',
              icon: 'el-icon-s-custom',
              order: 2,
              enabled: true,
              children: [
                {
                  id: 's7',
                  name: '网络连通性',
                  type: 'script',
                  icon: 'el-icon-s-goods',
                  scriptFile: 'scripts/network_test.py',
                  description: '测试网络连通性',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'target', defaultValue: '8.8.8.8' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'g4',
          name: 'P4 - 性能测试',
          type: 'group',
          icon: 'el-icon-s-data',
          order: 4,
          enabled: true,
          children: [
            {
              id: 'm5',
              name: '负载测试',
              type: 'menu',
              icon: 'el-icon-s-order',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's8',
                  name: '压力测试脚本',
                  type: 'script',
                  icon: 'el-icon-s-comment',
                  scriptFile: 'scripts/stress_test.py',
                  description: '执行系统压力测试',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'threads', defaultValue: '10' },
                    { name: 'duration', defaultValue: '60' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },

  computed: {
    // 统计信息
    stats() {
      const stats = { groups: 0, menus: 0, scripts: 0, total: 0 }

      const countNodes = (nodes) => {
        nodes.forEach(node => {
          stats[node.type + 's']++
          stats.total++
          if (node.children && node.children.length > 0) {
            countNodes(node.children)
          }
        })
      }

      countNodes(this.menuData)
      return stats
    }
  },

  watch: {
    searchText(val) {
      this.$refs.menuTree.filter(val)
    },
    // 监听菜单数据变化，标记有未保存的修改
    menuData: {
      handler() {
        // 只有在不是保存中状态时才标记为未保存
        if (!this.saving) {
          this.hasUnsavedChanges = true
        }
      },
      deep: true
    }
  },

  mounted() {
    this.loadConfig()
    this.loadRequirementList()
  },

  beforeDestroy() {
    // 移除事件监听，防止内存泄漏
    try {
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      document.removeEventListener('touchmove', this.onDragTouch)
      document.removeEventListener('touchend', this.stopDragTouch)
    } catch (e) {
      // ignore
    }
  },

  methods: {
    // 拖拽相关：开始（鼠标）
    startDrag(e) {
      this.dragging = true
      this.dragStartX = e.clientX
      this.dragStartWidth = this.leftWidth
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    // 拖拽相关：移动（鼠标）
    onDrag(e) {
      if (!this.dragging) return
      const delta = e.clientX - this.dragStartX
      this.setLeftWidth(this.dragStartWidth + delta)
    },

    // 拖拽相关：停止（鼠标）
    stopDrag() {
      if (!this.dragging) return
      this.dragging = false
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      localStorage.setItem('menu_left_width', String(this.leftWidth))
    },

    // 触摸开始
    startDragTouch(e) {
      if (!e.touches || !e.touches[0]) return
      this.dragging = true
      this.dragStartX = e.touches[0].clientX
      this.dragStartWidth = this.leftWidth
      document.addEventListener('touchmove', this.onDragTouch, { passive: false })
      document.addEventListener('touchend', this.stopDragTouch)
    },

    // 触摸移动
    onDragTouch(e) {
      if (!this.dragging) return
      e.preventDefault()
      if (!e.touches || !e.touches[0]) return
      const delta = e.touches[0].clientX - this.dragStartX
      this.setLeftWidth(this.dragStartWidth + delta)
    },

    // 触摸结束
    stopDragTouch() {
      if (!this.dragging) return
      this.dragging = false
      document.removeEventListener('touchmove', this.onDragTouch)
      document.removeEventListener('touchend', this.stopDragTouch)
      localStorage.setItem('menu_left_width', String(this.leftWidth))
    },

    // 设置左侧宽度并做范围限制
    setLeftWidth(val) {
      const min = 200
      const max = Math.max(300, window.innerWidth - 300)
      let w = Math.round(val)
      if (w < min) w = min
      if (w > max) w = max
      this.leftWidth = w
    },
    // 加载配置
    loadConfig() {
      // 优先从数据库读取配置
      getMenuConfig()
        .then(res => {
          if (res && (res.code === 20000 || res.code === 200)) {
            const config = res.data
            if (config && Array.isArray(config) && config.length > 0) {
              this.menuData = config
              this.originalData = JSON.parse(JSON.stringify(this.menuData))
              console.log('从数据库加载配置成功')
              return
            }
          }
          // 数据库没有配置，尝试从 localStorage 读取
          this.loadFromLocalStorage()
        })
        .catch(err => {
          console.error('从数据库读取配置失败:', err)
          // 数据库读取失败，回退到 localStorage
          this.loadFromLocalStorage()
        })
    },

    // 从 localStorage 读取配置的备用方法
    loadFromLocalStorage() {
      const saved = localStorage.getItem('script_menu_config')
      if (saved) {
        try {
          this.menuData = JSON.parse(saved)
          this.originalData = JSON.parse(JSON.stringify(this.menuData))
          console.log('从 localStorage 加载配置成功')
        } catch (e) {
          console.error('从 localStorage 加载配置失败:', e)
          this.loadDefaultData()
        }
      } else {
        this.loadDefaultData()
      }
    },

    // 加载默认配置
    loadDefaultData() {
      this.menuData = JSON.parse(JSON.stringify(this.defaultData))
      this.originalData = JSON.parse(JSON.stringify(this.menuData))
      console.log('使用默认配置')
    },

    // 重置为默认配置
    resetToDefault() {
      this.$confirm('确定要重置为默认配置吗？当前配置将会丢失。', '提示', {
        type: 'warning'
      }).then(() => {
        this.menuData = JSON.parse(JSON.stringify(this.defaultData))
        this.currentNode = null
        this.$message.success('已重置为默认配置')
      })
    },

    // 保存配置
    saveConfig() {
      this.saving = true
      // 验证表单
      if (this.currentNode) {
        this.$refs.configForm.validate(valid => {
          if (valid) {
            this.doSave()
          } else {
            this.saving = false
            return false
          }
        })
      } else {
        this.doSave()
      }
    },

    doSave() {
      // 保存到本地存储
      localStorage.setItem('script_menu_config', JSON.stringify(this.menuData))

      // 调用API保存到数据库
      saveMenuConfig(this.menuData)
        .then(res => {
          if (res && (res.code === 20000 || res.code === 200)) {
            // 更新原始数据
            this.originalData = JSON.parse(JSON.stringify(this.menuData))
            // 重置未保存标志
            this.hasUnsavedChanges = false
            // 通知主页面更新
            window.dispatchEvent(new CustomEvent('menuConfigUpdated', {
              detail: this.menuData
            }))
            this.saving = false
            this.$message.success('配置保存成功')
          } else {
            this.saving = false
            this.$message.error('保存失败: ' + (res && res.message ? res.message : '未知错误'))
          }
        })
        .catch(err => {
          this.saving = false
          console.error('保存配置错误:', err)
          this.$message.error('保存失败，请查看控制台日志')
        })
    },

    // 导出配置
    exportConfig() {
      const dataStr = JSON.stringify(this.menuData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `menu_config_${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      this.$message.success('配置导出成功')
    },

    // 导入配置
    handleFileUpload(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          this.menuData = config
          this.currentNode = null
        } catch (error) {
          this.$message.error('配置文件格式错误')
        }
      }
      reader.readAsText(file.raw)
    },

    confirmImport() {
      this.showImport = false
      this.$message.success('配置导入成功')
    },

    // 树节点操作
    addGroup() {
      const newGroup = {
        id: 'group_' + Date.now(),
        name: '新分组',
        type: 'group',
        icon: 'el-icon-folder',
        order: this.menuData.length + 1,
        enabled: true,
        children: []
      }
      this.menuData.push(newGroup)
      this.editNode(newGroup)
    },

    addChild(node, data) {
      let childType = 'menu'
      if (data.type === 'menu') {
        childType = 'script'
      }

      const newChild = {
        id: `${childType}_${Date.now()}`,
        name: `新${childType === 'menu' ? '菜单' : '脚本'}`,
        type: childType,
        icon: this.getNodeIcon(childType),
        order: data.children ? data.children.length + 1 : 1,
        enabled: true
      }

      if (childType === 'script') {
        newChild.scriptFile = 'scripts/new_script.py'
        newChild.description = '新的脚本文件'
        newChild.params = []
        // 初始化需求列表字段
        newChild.requirement_number = []
        // 初始化下拉选择的临时模型（多选）
        newChild._selectedRequirementIds = []
      }

      if (!data.children) {
        this.$set(data, 'children', [])
      }
      data.children.push(newChild)

      // 展开父节点
      node.expanded = true
      this.editNode(newChild)
    },

    editNode(node) {
      // 如果当前有未保存的脚本上传，切换时提醒
      if (this.hasUnsavedChanges && this.currentNode && this.currentNode.type === 'script') {
        this.$confirm('当前脚本还未保存，是否继续切换？', '提示', {
          type: 'warning',
          confirmButtonText: '继续',
          cancelButtonText: '取消'
        }).then(() => {
          this.currentNode = node
          this.hasUnsavedChanges = false
          // 确保有params数组
          if (node.type === 'script') {
            if (!node.params) {
              this.$set(node, 'params', [])
            }
            if (!node.requirement_number) {
              this.$set(node, 'requirement_number', [])
            }
          }
        }).catch(() => {
          // 取消切换
        })
      } else {
        this.currentNode = node
        // 确保有params数组
        if (node.type === 'script') {
          if (!node.params) {
            this.$set(node, 'params', [])
          }
          if (!node.requirement_number) {
            this.$set(node, 'requirement_number', [])
          }
          if (!node._selectedRequirementIds) {
            this.$set(node, '_selectedRequirementIds', [])
          }
        }
      }
    },

    deleteNode(node, data) {
      this.$confirm('确定要删除这个节点吗？', '提示', {
        type: 'warning'
      }).then(() => {
        const parent = node.parent
        if (parent) {
          const children = parent.data.children || parent.data
          const index = children.findIndex(child => child.id === data.id)
          if (index > -1) {
            children.splice(index, 1)
          }
        } else {
          const index = this.menuData.findIndex(item => item.id === data.id)
          if (index > -1) {
            this.menuData.splice(index, 1)
          }
        }

        if (this.currentNode === data) {
          this.currentNode = null
        }

        this.$message.success('删除成功')
      })
    },

    // 树节点过滤
    filterNode(value, data) {
      if (!value) return true
      return data.name.toLowerCase().includes(value.toLowerCase())
    },

    // 节点点击
    handleNodeClick(data) {
      this.editNode(data)
    },

    // 拖拽处理
    handleDrop() {
      // 更新order
      this.updateOrders()
    },

    // 更新顺序
    updateOrders() {
      const updateNodeOrder = (nodes, baseOrder = 0) => {
        nodes.forEach((node, index) => {
          node.order = baseOrder + index + 1
          if (node.children) {
            updateNodeOrder(node.children)
          }
        })
      }
      updateNodeOrder(this.menuData)
    },

    // 切换展开/收起
    toggleExpand() {
      this.isExpanded = !this.isExpanded
      const tree = this.$refs.menuTree
      const nodes = tree.store._getAllNodes()
      nodes.forEach(node => {
        node.expanded = this.isExpanded
      })
    },

    // 获取节点图标
    getNodeIcon(type) {
      const icons = {
        group: 'el-icon-folder',
        menu: 'el-icon-folder-opened',
        script: 'el-icon-document'
      }
      return icons[type] || 'el-icon-question'
    },

    // 获取节点类型标签
    getNodeTypeTag(type) {
      const tags = {
        group: '',
        menu: 'success',
        script: 'info'
      }
      return tags[type] || ''
    },

    // 获取节点类型名称
    getNodeTypeName(type) {
      const names = {
        group: '分组',
        menu: '菜单',
        script: '脚本'
      }
      return names[type] || '未知'
    },

    // 类型变化处理
    handleTypeChange(type) {
      // 更新默认图标
      this.currentNode.icon = this.getNodeIcon(type)

      // 如果是脚本，初始化必要字段
      if (type === 'script') {
        if (!this.currentNode.scriptFile) {
          this.$set(this.currentNode, 'scriptFile', 'scripts/new_script.py')
        }
        if (!this.currentNode.description) {
          this.$set(this.currentNode, 'description', '脚本描述')
        }
        if (!this.currentNode.params) {
          this.$set(this.currentNode, 'params', [])
        }
        if (!this.currentNode.requirement_number) {
          this.$set(this.currentNode, 'requirement_number', [])
        }
      }
    },

    // 参数操作
    addParam() {
      if (!this.currentNode.params) {
        this.$set(this.currentNode, 'params', [])
      }
      this.currentNode.params.push({
        name: '',
        defaultValue: ''
      })
    },

    removeParam(index) {
      this.currentNode.params.splice(index, 1)
    },

    // 需求信息管理：添加需求到脚本节点（支持单个 id 或数组）
    addRequirementToNode(node, requirementIdOrArray) {
      console.log(node, requirementIdOrArray);

      if (!node || !requirementIdOrArray) return
      if (!node.requirement_number) {
        this.$set(node, 'requirement_number', [])
      }

      const addOne = (requirementId) => {
        if (!requirementId) return
        const exist = node.requirement_number.some(r => r.number === requirementId)
        if (exist) return
        const req = this.requirementList.find(r => r.number === requirementId)
        if (!req) return
        node.requirement_number.push(JSON.parse(JSON.stringify(req)))
      }

      if (Array.isArray(requirementIdOrArray)) {
        requirementIdOrArray.forEach(id => addOne(id))
      } else {
        addOne(requirementIdOrArray)
      }

      // 清空选择模型（多选时清空为[]，单选时设为 null）
      if (Array.isArray(node._selectedRequirementIds)) {
        node._selectedRequirementIds = []
      } else {
        node._selectedRequirementId = null
      }
      this.hasUnsavedChanges = true
    },

    // 从脚本节点移除需求
    removeRequirementFromNode(node, requirementId) {
      if (!node || !node.requirement_number) return
      const idx = node.requirement_number.findIndex(r => r.id === requirementId)
      if (idx > -1) {
        node.requirement_number.splice(idx, 1)
        this.hasUnsavedChanges = true
      }
    },

    // 浏览脚本文件/打开上传对话框
    browseScript() {
      if (!this.currentNode) {
        this.$message.warning('请先选择一个脚本节点')
        return
      }
      this.scriptNodeRef = this.currentNode
      // 初始化对话框内容（保留原路径作为文件名提示）
      const path = this.currentNode.scriptFile || ''
      this.scriptFileName = path.split('/').pop() || ''
      this.scriptContent = ''
      this.scriptFileRaw = null
      this.showScriptDialog = true
    },

    // 处理本地选择的脚本文件
    onScriptFileChange(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      if (!file.name.endsWith('.py')) {
        this.$message.error('只能选择 .py 文件')
        return
      }
      this.scriptFileRaw = file
      this.scriptFileName = file.name
      const reader = new FileReader()
      reader.onload = (ev) => {
        this.scriptContent = ev.target.result
      }
      reader.readAsText(file)
    },

    // 将编辑内容或选择的文件上传到后端（只上传，不绑定）
    async uploadScriptToServer() {
      if (!this.scriptNodeRef) {
        this.$message.error('未绑定脚本节点')
        return
      }
      if (!this.scriptFileName && !this.scriptContent) {
        this.$message.warning('请选择或编辑要上传的脚本内容')
        return
      }
      this.uploadingScript = true
      try {
        let fileBlob = null
        const filename = this.scriptFileName || `script_${Date.now()}.py`
        if (this.scriptFileRaw) {
          fileBlob = this.scriptFileRaw
        } else {
          fileBlob = new Blob([this.scriptContent], { type: 'text/x-python' })
        }

        const formData = new FormData()
        formData.append('file', fileBlob, filename)
        // 可加上额外字段，如目标路径或 node id
        formData.append('nodeId', this.scriptNodeRef.id)

        const res = await uploadScript(formData)
        console.log('上传py文件结果为：', res)
        // 兼容不同后端返回结构：优先使用 savedPath，其次 path，再其次 url
        const uploadedPath = (res && res.data && res.data.savedPath) || (res && res.data && res.data.path) || (res && res.path) || (res && res.url)
        if (uploadedPath) {
          // 临时保存上传的脚本路径，等待确定后再绑定
          this.uploadedScriptPath = uploadedPath
          // 标记上传成功，启用确定按钮
          this.scriptUploadSuccess = true
          this.$message.success('脚本上传成功，点击确定绑定')
        } else {
          this.$message.warning('上传成功但无法获取文件路径，请手动输入')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('上传失败，请查看控制台或后端日志')
      } finally {
        this.uploadingScript = false
      }
    },

    // 点击确定按钮绑定脚本
    confirmScriptBinding() {
      if (!this.scriptNodeRef) {
        this.$message.error('未绑定脚本节点')
        return
      }
      if (!this.uploadedScriptPath) {
        this.$message.warning('请先上传脚本文件')
        return
      }
      // 将上传的脚本路径绑定到当前节点
      this.scriptNodeRef.scriptFile = this.uploadedScriptPath
      // 标记有未保存的脚本配置修改
      this.hasUnsavedChanges = true
      this.$message.success('脚本已绑定')
      this.showScriptDialog = false
      // 重置状态
      this.scriptUploadSuccess = false
      this.uploadedScriptPath = ''
      this.scriptFileName = ''
      this.scriptContent = ''
      this.scriptFileRaw = null
    },

    // 打开服务器脚本列表对话框
    async openServerScriptList() {
      if (!this.currentNode || this.currentNode.type !== 'script') {
        this.$message.warning('请先选择一个脚本节点')
        return
      }
      this.loadingServerScripts = true
      try {
        const res = await getScriptList()
        this.serverScriptList = (res && res.data) || []
        this.showServerScriptDialog = true
      } catch (err) {
        console.error(err)
        this.$message.error('获取服务器脚本列表失败')
      } finally {
        this.loadingServerScripts = false
      }
    },

    // 从服务器列表选择脚本（直接绑定，不需要上传）
    selectServerScript(scriptPath) {
      if (this.currentNode) {
        this.currentNode.scriptFile = scriptPath
        // 标记有未保存的脚本配置修改
        this.hasUnsavedChanges = true
        this.$message.success('脚本已绑定')
        // 关闭两个对话框
        this.showServerScriptDialog = false
        this.showScriptDialog = false
        // 重置上传状态（服务器脚本选择不需要上传）
        this.scriptUploadSuccess = false
        this.uploadedScriptPath = ''
        this.scriptFileName = ''
        this.scriptContent = ''
        this.scriptFileRaw = null
      }
    },

    // 刷新预览
    refreshPreview() {
      // 强制更新预览
      this.menuData = [...this.menuData]
      this.$message.success('预览已刷新')
    },

    // 加载需求列表从后端接口
    loadRequirementList() {
      this.loadingRequirements = true
      getRequirementList()
        .then(res => {
          if (res && (res.code === 20000 || res.code === 200)) {
            const data = res.data
            if (Array.isArray(data)) {
              this.requirementList = data
              console.log('加载需求列表成功:', data)
            } else {
              this.$message.warning('需求列表格式不正确')
            }
          } else {
            this.$message.error('加载需求列表失败: ' + (res && res.message ? res.message : '未知错误'))
          }
        })
        .catch(err => {
          console.error('加载需求列表错误:', err)
          this.$message.error('加载需求列表失败，请检查后端服务')
        })
        .finally(() => {
          this.loadingRequirements = false
        })
    },

    // 打开需求上传对话框
    openRequirementUploadDialog() {
      this.showRequirementUploadDialog = true
      // 清空之前的选择和解析预览，保证每次选择文件都是新的会话
      this.requirementFile = null
      this.requirementPreview = []
      this.requirementPreviewHeaders = []
      this.requirementPreviewValid = false
    },

    // 处理需求文件选择
    async handleRequirementFileChange(file) {
      const raw = file && file.raw
      if (!raw) return false
      // 选择新文件时，先清空之前的预览数据（防止残留旧内容在解析失败时仍显示）
      this.requirementPreview = []
      this.requirementPreviewHeaders = []
      this.requirementPreviewValid = false
      const mime = raw.type || ''
      const isExcel = mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      mime === 'application/vnd.ms-excel' ||
                      raw.name && (raw.name.endsWith('.xlsx') || raw.name.endsWith('.xls'))
      if (!isExcel) {
        this.$message.error('请选择 Excel 文件（.xlsx 或 .xls）')
        return false
      }
      this.requirementFile = raw
      // 解析文件为 JSON 并填充预览（显示原始列以供确认）
      try {
        const rows = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const data = e.target.result
              const wb = XLSX.read(data, { type: 'array' })
              const firstSheet = wb.SheetNames[0]
              const sheet = wb.Sheets[firstSheet]
              const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
              resolve(json)
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = (err) => reject(err)
          reader.readAsArrayBuffer(raw)
        })
        // 使用原始解析结果作为预览内容，保留原始列名
        this.requirementPreview = rows || []
        // 计算实际表头（优先使用首行的 keys）
        this.requirementPreviewHeaders = this.requirementPreview.length ? Object.keys(this.requirementPreview[0]) : []

        // 简单校验：必须包含 编号/ID、需求名称、备注 之一（支持常见同义词），并以 `number,name,description` 发送给后端
        const headersLower = this.requirementPreviewHeaders.map(h => String(h).toLowerCase())
        const containsAny = (candidates) => candidates.some(c => headersLower.includes(c.toLowerCase()))

        const hasNumber = containsAny(['number', '编号', '需求编号', 'id', '需求id'])
        const hasName = containsAny(['需求名称', '名称', 'name'])
        const hasRemark = containsAny(['备注', '描述', '说明', 'remark', 'description'])

        this.requirementPreviewValid = hasNumber && hasName && hasRemark

        if (!this.requirementPreview.length) {
          this.$message.warning('Excel 内容为空或无法解析为需求')
        }
      } catch (err) {
        console.error('解析 Excel 错误:', err)
        this.$message.error('解析 Excel 失败，请检查文件格式')
      }

      return false // 阻止 el-upload 自动上传
    },

    // 关闭需求上传对话框并清空临时数据
    closeRequirementUploadDialog() {
      this.showRequirementUploadDialog = false
      this.requirementFile = null
      this.requirementPreview = []
      this.requirementPreviewHeaders = []
      this.requirementPreviewValid = false
    },

    // 上传并保存需求：发送已解析并确认的 JSON（requirementPreview）到后端
    async uploadRequirements() {
      if (!this.requirementPreview || !this.requirementPreview.length) {
        this.$message.warning('没有可发送的需求数据，请先选择并解析 Excel 文件')
        return
      }
      if (!this.requirementPreviewValid) {
        this.$message.warning('表格缺少必需表头（ID、需求名称、备注），请检查后重试')
        return
      }
      this.uploadingRequirements = true
      try {
        // 发送 JSON 到后端（后端应接受数组 JSON）
        // 先将原始 preview 映射为后端需要的 {id,name,description}
        const headers = this.requirementPreviewHeaders.map(h => String(h))
        const headersLower = headers.map(h => h.toLowerCase())
        const findHeader = (candidates) => {
          for (const cand of candidates) {
            const idx = headersLower.indexOf(cand.toLowerCase())
            if (idx > -1) return headers[idx]
          }
          return null
        }

        const numberKey = findHeader(['number', '编号', '需求编号', 'id', '需求id'])
        const nameKey = findHeader(['需求名称', '名称', 'name'])
        const descKey = findHeader(['备注', '描述', '说明', 'remark', 'description'])

        const mapped = this.requirementPreview.map(r => ({
          number: r[numberKey] != null ? String(r[numberKey]) : null,
          name: r[nameKey] != null ? String(r[nameKey]) : '',
          description: r[descKey] != null ? String(r[descKey]) : ''
        }))

        const res = await saveRequirementList(mapped)
        if (res && (res.code === 20000 || res.code === 200)) {
          this.$message.success('需求导入成功')
          this.showRequirementUploadDialog = false
          this.requirementFile = null
          this.requirementPreview = []
          this.requirementPreviewHeaders = []
          this.requirementPreviewValid = false
          // 重新加载需求列表
          this.loadRequirementList()
        } else {
          this.$message.error('上传需求失败: ' + (res && res.message ? res.message : '未知错误'))
        }
      } catch (err) {
        console.error('上传需求错误:', err)
        this.$message.error('上传需求失败，请查看控制台')
      } finally {
        this.uploadingRequirements = false
      }
    }
  }
}
</script>

<style scoped>
.menu-config-simple {
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.config-header {
  background: #fff;
  padding: 15px 20px;
  border-bottom: 1px solid #e6ebf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-desc {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.config-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 15px;
  gap: 15px;
}

.left-section {
  /* 初始/最小宽度由 JS 控制并持久化到 localStorage */
  min-width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.splitter {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.15s;
}
.splitter:hover {
  background: rgba(0,0,0,0.04);
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  overflow: hidden;
}

.el-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 !important;
  border-bottom: none !important;
}

.section-header span {
  font-weight: 500;
  font-size: 16px;
  color: #303133;
}

.section-actions {
  display: flex;
  gap: 5px;
}

.tree-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
}

.tree-container >>> .el-tree {
  padding: 10px 0;
}

.tree-container >>> .el-scrollbar__wrap {
  overflow-x: hidden;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 5px 8px;
  margin: 0 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tree-node:hover {
  background-color: #f5f7fa;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.node-icon {
  width: 16px;
  text-align: center;
  color: #606266;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-tag {
  margin-left: 8px;
  flex-shrink: 0;
}

.node-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.tree-stats {
  padding: 10px 15px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #fafafa;
}

.stat-item {
  text-align: center;
  padding: 5px 10px;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 5px;
}

.node-status {
  display: flex;
  align-items: center;
}

.params-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background: #f5f7fa;
}

.param-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.param-item:last-child {
  margin-bottom: 0;
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-tip {
  text-align: center;
}

.empty-tip p {
  margin: 10px 0 5px 0;
  font-size: 14px;
}

.empty-tip small {
  font-size: 12px;
  color: #c0c4cc;
}

.preview-card {
  flex: 1;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #fafafa;
  border-radius: 4px;
}

.preview-group {
  margin-bottom: 15px;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
  border: 1px solid #e6ebf5;
}

.preview-group-title {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-children {
  margin-left: 20px;
}

.preview-menu {
  margin-bottom: 10px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.preview-menu-title {
  font-weight: 500;
  color: #67c23a;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-scripts {
  margin-left: 15px;
}

.preview-script {
  padding: 5px 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 2px solid #e4e7ed;
  margin-bottom: 3px;
}

.preview-script:last-child {
  margin-bottom: 0;
}

.script-file {
  color: #909399;
  font-size: 11px;
  margin-left: 5px;
}

.import-content {
  padding: 20px;
}

.config-upload {
  text-align: center;
}

.import-tips {
  margin-top: 20px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
}

.script-dialog-tips {
  margin-bottom: 15px;
  padding: 10px;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 2px;
  font-size: 12px;
  color: #0050b3;
}

.script-dialog-tips i {
  margin-right: 5px;
}

.script-upload-dialog {
  margin-bottom: 10px;
}

.requirement-dialog-tips {
  margin-bottom: 15px;
  padding: 10px;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 2px;
  font-size: 12px;
  color: #0050b3;
}

.requirement-dialog-tips i {
  margin-right: 5px;
}

.requirement-upload-dialog {
  margin-bottom: 10px;
}

.requirement-upload {
  text-align: center;
}

/* 滚动条样式 */
.form-container::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.form-container::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.form-container::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

@media (max-width: 992px) {
  .config-main {
    flex-direction: column;
  }

  .left-section {
    width: 100%;
    height: 300px;
  }

  .right-section {
    height: auto;
  }
}
</style>

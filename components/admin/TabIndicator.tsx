import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { FaPlus, FaCheck, FaTimes, FaTrash, FaEdit } from "react-icons/fa";

const MySwal = withReactContent(Swal);

interface Indicator {
  id: string;
  name: string;
  IndicatorType: "SCALE_1_4" | "YES_NO";
  weight: number;
  requiredEvidences: boolean;
}

interface Topic {
  id: string;
  name: string;
  indicators: Indicator[];
}

export default function TabIndicator({ evaluationId }: { evaluationId: string }) {
  const { user } = useAuthStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");

  const [addingIndicatorTopicId, setAddingIndicatorTopicId] = useState<string | null>(null);
  const [newIndicator, setNewIndicator] = useState({ name: "", type: "SCALE_1_4", weight: 0, requiresEvidence: false });

  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [editingIndicatorData, setEditingIndicatorData] = useState({ name: "", type: "SCALE_1_4", weight: 0, requiresEvidence: false });

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/evaluation/${evaluationId}`);
      setTopics(res.data);
    } catch {
      console.error("Failed to fetch topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [evaluationId]);

  // Topic Actions
  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      await api.post(`/topics`, { 
        evaluationId, 
        name: newTopicName, 
        description: "", 
        createdBy: user?.id 
      });
      setNewTopicName("");
      fetchTopics();
    } catch (err: any) {
      MySwal.fire("ข้อผิดพลาด", err.response?.data?.message || "เพิ่มหัวข้อไม่สำเร็จ", "error");
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const res = await MySwal.fire({ title: "ลบหัวข้อนี้?", icon: "warning", showCancelButton: true });
    if (res.isConfirmed) {
      try {
        await api.delete(`/topics/${topicId}`);
        fetchTopics();
      } catch {
        MySwal.fire("ข้อผิดพลาด", "ลบหัวข้อไม่สำเร็จ", "error");
      }
    }
  };

  const handleUpdateTopic = async (topicId: string) => {
    try {
      await api.put(`/topics/${topicId}`, { name: editingTopicName, description: "" });
      setEditingTopicId(null);
      fetchTopics();
    } catch {
      MySwal.fire("ข้อผิดพลาด", "แก้ไขหัวข้อไม่สำเร็จ", "error");
    }
  };

  // Indicator Actions
  const handleAddIndicator = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const currentWeight = (topic.indicators || []).reduce((sum, ind) => sum + ind.weight, 0);
    if (currentWeight + newIndicator.weight > 100) {
      return MySwal.fire("น้ำหนักเกิน!", "น้ำหนักรวมในหัวข้อนี้ห้ามเกิน 100%", "warning");
    }
    if (!newIndicator.name.trim() || newIndicator.weight <= 0) {
      return MySwal.fire("คำเตือน", "กรุณากรอกชื่อตัวชี้วัดและน้ำหนักให้ถูกต้อง", "warning");
    }

    try {
      await api.post(`/indicators`, {
        topicId: topicId,
        name: newIndicator.name,
        IndicatorType: newIndicator.type,
        description: "",
        requiredEvidences: newIndicator.requiresEvidence,
        weight: newIndicator.weight
      });
      setAddingIndicatorTopicId(null);
      setNewIndicator({ name: "", type: "SCALE_1_4", weight: 0, requiresEvidence: false });
      fetchTopics();
    } catch (err: any) {
      MySwal.fire("ข้อผิดพลาด", err.response?.data?.message || "เพิ่มตัวชี้วัดไม่สำเร็จ", "error");
    }
  };

  const handleUpdateIndicator = async (topicId: string, indicatorId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    // Check if new addition exceeds 100% (minus the old weight of this indicator)
    const oldIndicator = topic.indicators.find(i => i.id === indicatorId);
    if (!oldIndicator) return;
    
    // Calculate sum without this indicator
    const weightWithoutThis = (topic.indicators || []).reduce((sum, ind) => ind.id === indicatorId ? sum : sum + ind.weight, 0);
    
    if (weightWithoutThis + editingIndicatorData.weight > 100) {
      return MySwal.fire("น้ำหนักเกิน!", "น้ำหนักรวมในหัวข้อนี้ห้ามเกิน 100%", "warning");
    }
    
    if (!editingIndicatorData.name.trim() || editingIndicatorData.weight <= 0) {
      return MySwal.fire("คำเตือน", "กรุณากรอกชื่อตัวชี้วัดและน้ำหนักให้ถูกต้อง", "warning");
    }

    try {
      await api.put(`/indicators/${indicatorId}`, {
        name: editingIndicatorData.name,
        IndicatorType: editingIndicatorData.type,
        description: "",
        requiredEvidences: editingIndicatorData.requiresEvidence,
        weight: editingIndicatorData.weight
      });
      setEditingIndicatorId(null);
      fetchTopics();
    } catch {
      MySwal.fire("ข้อผิดพลาด", "แก้ไขตัวชี้วัดไม่สำเร็จ", "error");
    }
  };

  const handleDeleteIndicator = async (indicatorId: string) => {
    const res = await MySwal.fire({ title: "ลบตัวชี้วัดนี้?", icon: "warning", showCancelButton: true });
    if (res.isConfirmed) {
      try {
        await api.delete(`/indicators/${indicatorId}`);
        fetchTopics();
      } catch {
        MySwal.fire("ข้อผิดพลาด", "ลบตัวชี้วัดไม่สำเร็จ", "error");
      }
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      {/* Top action: Add new topic */}
      <div className="flex gap-2 mb-6">
        <Input 
          placeholder="เพิ่มหัวข้อประเมินใหม่..." 
          value={newTopicName} 
          onChange={(e) => setNewTopicName(e.target.value)} 
          className="mb-0 max-w-sm"
        />
        <Button onClick={handleAddTopic}><FaPlus className="mr-2"/> เพิ่มหัวข้อ</Button>
      </div>

      {topics.map((topic, tIndex) => (
        <div key={topic.id} className="border rounded-lg shadow-sm p-4 bg-white">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            {editingTopicId === topic.id ? (
              <div className="flex gap-2">
                <Input value={editingTopicName} onChange={e => setEditingTopicName(e.target.value)} className="mb-0" />
                <Button size="sm" onClick={() => handleUpdateTopic(topic.id)}>บันทึก</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingTopicId(null)}>ยกเลิก</Button>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 inline-flex items-center justify-center text-sm mr-2">{tIndex + 1}</span>
                {topic.name}
              </h3>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditingTopicId(topic.id); setEditingTopicName(topic.name); }}><FaEdit /></Button>
              <Button size="sm" variant="danger" onClick={() => handleDeleteTopic(topic.id)}><FaTrash /></Button>
            </div>
          </div>

          <table className="w-full text-sm text-left align-middle border-collapse">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 w-12">ลำดับ</th>
                <th className="px-4 py-2 w-1/3">ชื่อตัวชี้วัด</th>
                <th className="px-4 py-2 w-1/6">ประเภท</th>
                <th className="px-4 py-2 w-1/12 text-center">น้ำหนัก</th>
                <th className="px-4 py-2 w-1/6 text-center">หลักฐาน</th>
                <th className="px-4 py-2 w-24 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(topic.indicators || []).map((ind, iIndex) => (
                <React.Fragment key={ind.id}>
                  {editingIndicatorId === ind.id ? (
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3">{iIndex + 1}</td>
                      <td className="px-4 py-3">
                        <Input placeholder="ชื่อตัวชี้วัด..." value={editingIndicatorData.name} onChange={e => setEditingIndicatorData({...editingIndicatorData, name: e.target.value})} className="mb-0" />
                      </td>
                      <td className="px-4 py-3">
                        <select className="border-gray-300 rounded block w-full text-sm p-2" value={editingIndicatorData.type} onChange={e => setEditingIndicatorData({...editingIndicatorData, type: e.target.value as any})}>
                          <option value="SCALE_1_4">ระดับ 1-4</option>
                          <option value="YES_NO">ผ่าน/ไม่ผ่าน</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" min={1} max={100} value={editingIndicatorData.weight} onChange={e => setEditingIndicatorData({...editingIndicatorData, weight: Number(e.target.value)})} className="mb-0 mx-auto w-20 text-center" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select className="border-gray-300 rounded block w-full text-sm p-2" value={editingIndicatorData.requiresEvidence ? "true" : "false"} onChange={e => setEditingIndicatorData({...editingIndicatorData, requiresEvidence: e.target.value === "true"})}>
                          <option value="false">ไม่ต้องการ</option>
                          <option value="true">ต้องการ</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right flex gap-1 justify-end">
                        <Button size="sm" onClick={() => handleUpdateIndicator(topic.id, ind.id)}>บันทึก</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingIndicatorId(null)}>ยกเลิก</Button>
                      </td>
                    </tr>
                  ) : (
                    <tr className="border-b">
                      <td className="px-4 py-3">{iIndex + 1}</td>
                      <td className="px-4 py-3">{ind.name}</td>
                      <td className="px-4 py-3">
                        <Badge color={ind.IndicatorType === "SCALE_1_4" ? "blue" : "indigo"}>
                          {ind.IndicatorType === "SCALE_1_4" ? "ระดับ 1-4" : "ผ่าน/ไม่ผ่าน"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{ind.weight}%</td>
                      <td className="px-4 py-3 text-center">
                        {ind.requiredEvidences ? <span className="text-green-600 flex items-center justify-center gap-1"><FaCheck /> ต้องการ</span> : <span className="text-gray-400 flex items-center justify-center gap-1"><FaTimes /> ไม่ต้องการ</span>}
                      </td>
                      <td className="px-4 py-3 text-right flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingIndicatorId(ind.id);
                          setEditingIndicatorData({
                            name: ind.name,
                            type: ind.IndicatorType,
                            weight: ind.weight,
                            requiresEvidence: ind.requiredEvidences
                          });
                        }}><FaEdit /></Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteIndicator(ind.id)}><FaTrash /></Button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Inline Form Add Indicator */}
              {addingIndicatorTopicId === topic.id ? (
                <tr className="bg-blue-50">
                  <td className="px-4 py-3">+</td>
                  <td className="px-4 py-3">
                    <Input placeholder="ชื่อตัวชี้วัด..." value={newIndicator.name} onChange={e => setNewIndicator({...newIndicator, name: e.target.value})} className="mb-0" />
                  </td>
                  <td className="px-4 py-3">
                    <select className="border-gray-300 rounded block w-full text-sm p-2" value={newIndicator.type} onChange={e => setNewIndicator({...newIndicator, type: e.target.value as any})}>
                      <option value="SCALE_1_4">ระดับ 1-4</option>
                      <option value="YES_NO">ผ่าน/ไม่ผ่าน</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input type="number" min={1} max={100} value={newIndicator.weight} onChange={e => setNewIndicator({...newIndicator, weight: Number(e.target.value)})} className="mb-0 mx-auto w-20 text-center" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select className="border-gray-300 rounded block w-full text-sm p-2" value={newIndicator.requiresEvidence ? "true" : "false"} onChange={e => setNewIndicator({...newIndicator, requiresEvidence: e.target.value === "true"})}>
                      <option value="false">ไม่ต้องการ</option>
                      <option value="true">ต้องการ</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-1 justify-end">
                    <Button size="sm" onClick={() => handleAddIndicator(topic.id)}>บันทึก</Button>
                    <Button size="sm" variant="secondary" onClick={() => setAddingIndicatorTopicId(null)}>ยกเลิก</Button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-3 bg-gray-50">
                    <Button size="sm" variant="outline" onClick={() => setAddingIndicatorTopicId(topic.id)}>
                      + เพิ่มตัวชี้วัด
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">น้ำหนักรวม:</td>
                <td className={`px-4 py-2 text-center ${(topic.indicators || []).reduce((s, i) => s + i.weight, 0) > 100 ? 'text-red-500' : 'text-green-600'}`}>
                  {(topic.indicators || []).reduce((s, i) => s + i.weight, 0)}%
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}
